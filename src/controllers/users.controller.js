const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const User = require('../services/users.services.js');

const { sendOtpEmail, sendForgetPass, registered } = require("../helpers/mailServices.js");

const mysql = require('mysql2/promise');
const dbConfig = require('../helpers/db.js')



const TemporaryStorage = {};


const validateRequestBody = (req, res, requiredFields) => {
  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    res.status(400).send({ message: `Missing required fields: ${missingFields.join(', ')}` });
    return false;
  }
  return true;
};

// **Reusable Function: Check Unique Fields**
const checkUniqueFields = async (email, phone, lname, address, street) => {
  try {
    const duplicateFields = [];

    // 1. check email
    if (email) {
      const [rowsEmail] = await sql.query(
        `SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1`,
        [email.toLowerCase().trim()]
      );
      if (rowsEmail.length > 0) duplicateFields.push("email");
    }

    // 2. check phone
    if (phone) {
      const [rowsPhone] = await sql.query(
        `SELECT id FROM users WHERE phone = ? LIMIT 1`,
        [phone.toString().trim()]
      );
      if (rowsPhone.length > 0) duplicateFields.push("phone");
    }

    // 3. check lname + address together
    if (lname && address && street) {
      const [rowsNameAddr] = await sql.query(
        `SELECT id FROM users 
         WHERE LOWER(TRIM(lname)) = ? 
           AND LOWER(TRIM(address)) = ? 
            AND LOWER(TRIM(street)) = ?
         LIMIT 1`,
        [lname.toLowerCase().trim(), address.toLowerCase().trim(), street.toLowerCase().trim()]
      );
      if (rowsNameAddr.length > 0) duplicateFields.push("lname+address+street");
    }

    return duplicateFields.length > 0 ? duplicateFields : null;

  } catch (err) {
    throw new Error(err.message || "Database error occurred while checking unique fields.");
  }
};





const sql = dbConfig.promise()

exports.create = async (req, res) => {

  const requiredFields = ['email', 'password'];
  if (!validateRequestBody(req, res, requiredFields)) return;

  let {
    fname, lname, company_name, email, phone, password,
    address, street, subtown, zipcode, ort, dob,
    acc_no, ban_no, bc_no, role, role_id, floor, lift_availability
  } = req.body;

  fname = fname ? fname.toString() : '';
  lname = lname ? lname.toString() : '';
  address = address ? address.toString() : '';
  street = street ? street.toString() : '';

  const status = req.body.status !== undefined ? req.body.status : 1;

  try {
    // Duplicate check
    const duplicateFields = await checkUniqueFields(email, phone, lname, address, street);
    if (duplicateFields) {
      return res.status(400).send({
        status: 400,
        message: `Die folgenden Felder existieren bereits: ${duplicateFields.join(', ')}`,
      });
    }

    const username = fname + ' ' + (lname ? lname.charAt(0).toUpperCase() + lname.slice(1) : '');

    const hashedPassword =
      role && role.toLowerCase() === "driver"
        ? password
        : await bcrypt.hash(password, 10);

    // ==============================
    // DIRECT ROLE REGISTRATION
    // ==============================
    if (role) {
      let resolvedRoleId = role_id;

      if (!resolvedRoleId) {
        const [rows] = await sql.query(
          `SELECT id FROM roles WHERE LOWER(role_name) = ? LIMIT 1`,
          [role.toLowerCase()]
        );

        if (rows.length === 0) {
          return res.status(400).send({ message: `Invalid role '${role}' provided.` });
        }

        resolvedRoleId = rows[0].id;
      }

      const newUser = {
        fname, lname, company_name, status, username, email, phone,
        password: hashedPassword, address, street, subtown, zipcode, ort, dob,
        acc_no, ban_no, bc_no, role, role_id: resolvedRoleId,
        floor, lift_availability
      };

      User.create(newUser, (err, data) => {
        if (err) {
          return res.status(500).send({
            message: err.message || "An error occurred while creating the user.",
          });
        }

        res.send({
          status: true,
          message: 'User registered successfully (without OTP).',
          user: data,
        });
      });

    }
    // ==============================
    // CUSTOMER → OTP FLOW
    // ==============================
    else {

      // 🔥 DELETE OLD OTP FOR THIS EMAIL
      await sql.query('DELETE FROM otp_storage WHERE email = ?', [email]);

      // New OTP Generation
      const otp = crypto.randomInt(100000, 999999).toString();

      // Send OTP
      const mailResult = await sendOtpEmail(email, otp);
      if (!mailResult.success) {
        return res.status(500).send({ message: 'Error sending OTP email. Please try again later.' });
      }

      // Store OTP + user data
      await sql.query(
        `INSERT INTO otp_storage (email, otp, user_data) VALUES (?, ?, ?)`,
        [
          email,
          otp,
          JSON.stringify({
            fname,
            lname,
            company_name,
            status,
            username,
            email,
            phone,
            password: hashedPassword,
            address,
            street,
            subtown,
            zipcode,
            ort,
            dob,
            acc_no,
            ban_no,
            bc_no,
            floor,
            lift_availability,
            role: "customer"
          }),
        ]
      );

      return res.send({
        status: true,
        message:
          'Wir haben einen Bestätigungscode an Ihre E-Mail-Adresse gesendet. Bitte geben Sie diesen ein, um die Registrierung abzuschließen.',
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'An error occurred during the registration process.' });
  }
};













exports.forgetPass = async (req, res) => {
  console.log("Request received for forget password");

  const email = req.body.email;

  if (!email) {
    return res.status(400).send({ message: 'Email is required.' });
  }

  console.log("Processing email:", email);

  try {
    // Check if email exists in the database
    const [results] = await sql.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(404).send({ message: 'User not found.' });
    }

    console.log("User found in database:", results[0]);

    const token = crypto.randomBytes(5).toString('hex');
    const resetTokenExpiration = Date.now() + 3600000;

    await sql.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?',
      [token, resetTokenExpiration, email]
    );

    // Generate password reset link
    const link = `https://frischfuersie.de/forgetPass?email=${encodeURIComponent(email)}`;

    // const link = `http://localhost:4200/forgetPass?email=${encodeURIComponent(email)}`;
    console.log("Reset link:", link);

    // Send password reset email
    const mailResult = await sendForgetPass(email, link);

    if (!mailResult.success) {
      return res.status(500).send({ message: 'Error sending password reset email.' });
    }

    // Respond to the client
    res.send({ status: true, message: 'Password reset link sent to your email.' });

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send({ message: 'An error occurred. Please try again later.', error: err.message || err });
  }
};



// Function to verify OTP and create the user
exports.verifyOtp = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).send({ message: 'OTP is required for verification.' });
  }

  try {
    const [results] = await sql.query('SELECT * FROM otp_storage WHERE otp = ?', [otp]);

    if (!results || results.length === 0) {
      return res.status(400).send({ message: 'Invalid or expired OTP.' });
    }

    const otpRecord = results[0];
    let userData;
    try {
      userData = JSON.parse(otpRecord.user_data);
    } catch (parseError) {
      return res.status(500).send({ message: 'Invalid user data format in OTP storage.' });
    }

    // Fallback to default status if missing
    const status = userData.status !== undefined ? userData.status : 1;

    await sql.query(
      `INSERT INTO users (fname, lname, company_name, status, username, email, phone, password, address, street, subtown, zipcode, ort, dob, acc_no, ban_no, bc_no, role, floor, lift_availability) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.fname, userData.lname, userData.company_name, status,
        userData.username, userData.email, userData.phone, userData.password,
        userData.address, userData.street, userData.subtown, userData.zipcode, userData.ort,
        userData.dob, userData.acc_no, userData.ban_no, userData.bc_no, userData.role,
        userData.floor, userData.lift_availability
      ]
    );

    await registered(userData.email);
    await sql.query('DELETE FROM otp_storage WHERE otp = ?', [otp]);

    res.send({ status: true, message: 'User registered successfully.' });

  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.status(500).send({ message: 'An error occurred during OTP verification.' });
  }
};


exports.updatePass = async (req, res) => {
  console.log("Request received for forget password");

  const email = req.body.email;
  const password = req.body.newPassword;

  if (!email) {
    return res.status(400).send({ message: 'Email is required.' });
  }

  console.log("Processing email:", email);

  try {
    // Check if email exists in the database
    const [results] = await sql.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(404).send({ message: 'User not found.' });
    }

    console.log("User found in database:", results[0]);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Correct SQL query to update password
    await sql.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    // Respond to the client with success message
    res.send({ status: true, message: 'Password reset successfully.' });

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send({ message: 'An error occurred. Please try again later.', error: err.message || err });
  }
};


exports.updateUserStatus = (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (typeof status === "undefined") {
    return res.status(400).send({ message: "Status is required." });
  }

  User.updateStatusById(id, status, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).send({ message: `User with id ${id} not found.` });
      } else {
        return res.status(500).send({ message: "Error updating user status." });
      }
    }

    res.send({ status: true, message: "User status updated successfully.", data });
  });
};





exports.login = async (req, res) => {
  const { email, password } = req.body;

  User.login(email, async (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).send({ message: "User not found or account disabled." });
      } else {
        return res.status(500).send({ message: err.message || "Some error occurred while logging in." });
      }
    }

    const passwordIsValid = await bcrypt.compare(password, data.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid password." });
    }

    const token = jwt.sign(
      { id: data.id, email: data.email, role_id: data.role_id }, // Include role_id in token
      "lachurules",
      { expiresIn: "1h" }
    );

    res.send({
      status: true,
      message: "Login successful",
      token: token,
      user: data // Return full user data including fname, lname, phone
    });
  });
};


// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   User.login(email, async (err, data) => {
//     if (err) {
//       if (err.kind === "not_found") {
//         return res.status(404).send({ message: "User not found or account disabled." });
//       } else {
//         return res.status(500).send({ message: err.message || "Some error occurred while logging in." });
//       }
//     }

//     const passwordIsValid = await bcrypt.compare(password, data.password);
//     if (!passwordIsValid) {
//       return res.status(401).send({ message: "Invalid password." });
//     }

//     const token = jwt.sign({ id: data.id, email: data.email }, "lachurules", { expiresIn: "1h" });

//     res.send({
//       status: true,
//       message: "Login successful",
//       token: token,
//       user: { id: data.id, email: data.email }
//     });
//   });
// };


exports.read = (req, res) => {
  User.read((err, data) => {
    if (err) {
      res.status(500).send({ message: err.message || "Some error occurred while retrieving users." });
    } else {
      res.send({ status: true, message: "User fetched successfully", user: data });
    }
  });
};

exports.readById = (req, res) => {
  const userId = req.params.id;

  User.readById(userId, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({ message: `User with id ${userId} not found.` });
      } else {
        res.status(500).send({ message: `Error retrieving User with id ${userId}` });
      }
    } else {
      res.send({ status: true, message: "User fetched successfully", user: data });
    }
  });
};

exports.edit = async (req, res) => {
  try {
    const userId = req.params.id;

    let hashedPassword;

    // Hash password if provided
    if (req.body.password) {
      if (req.body.role && req.body.role.toLowerCase() === "driver") {
        hashedPassword = req.body.password; // Store plain text for driver
      } else {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
      }
    }

    // Default status to 1 if not provided
    const status = req.body.status !== undefined ? req.body.status : 1;

    let resolvedRoleId = req.body.role_id;

    // 🔑 If role_name is provided, resolve role_id from DB
    if (!resolvedRoleId && req.body.role) {
      const [rows] = await sql.query(
        `SELECT id FROM roles WHERE LOWER(role_name) = ? LIMIT 1`,
        [req.body.role.toLowerCase()]
      );
      if (rows.length === 0) {
        return res.status(400).send({ message: `Invalid role '${req.body.role}' provided.` });
      }
      resolvedRoleId = rows[0].id;
    }

    const user = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      company_name: req.body.company_name,
      password: hashedPassword, // undefined if password not updated
      address: req.body.address || null,
      street: req.body.street || null,
      subtown: req.body.subtown || null,
      zipcode: req.body.zipcode || null,
      ort: req.body.ort || null,
      dob: req.body.bday || null,
      acc_no: req.body.acchold || null,
      ban_no: req.body.IBAN || null,
      bc_no: req.body.BIC || null,
      role: req.body.role || "Customer",
      role_id: resolvedRoleId,   // ✅ always update role_id as well
      status: status,
      floor: req.body.floor || null,
      lift_availability: req.body.lift_availability || null
    };

    // Remove undefined fields
    Object.keys(user).forEach(key => user[key] === undefined && delete user[key]);

    User.update(userId, user, (err, data) => {
      if (err) {
        console.error(err);
        if (err.kind === "not_found") {
          return res.status(404).send({ message: `User with id ${userId} not found.` });
        } else {
          return res.status(500).send({ message: `Error updating User with id ${userId}` });
        }
      }
      res.send({ status: true, message: "User updated successfully", user: data });
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "An error occurred during user update." });
  }
};





exports.delete = (req, res) => {
  const userId = req.params.id;

  User.delete(userId, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({ message: `User with id ${userId} not found.` });
      } else {
        res.status(500).send({ message: `Could not delete User with id ${userId}` });
      }
    } else {
      res.send({ status: true, message: "User deleted successfully" });
    }
  });
};

//-----------------------------------------


exports.loginapp = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).send({ message: "Email and password are required." });
  }

  User.loginapp([email, password], async (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).send({ message: "User not found with provided credentials." });
      } else {
        return res.status(500).send({ message: err.message || "Some error occurred while logging in." });
      }
    }

    // Password validation (uncomment if using hashed passwords)
    // const passwordIsValid = await bcrypt.compare(password, data.password);
    // if (!passwordIsValid) {
    //   return res.status(401).send({ message: "Invalid password." });
    // }

    // Generate JWT (uncomment if JWT is needed)
    // const token = jwt.sign({ id: data.id, email: data.email }, "lachurules", { expiresIn: "1h" });

    res.send({
      status: true,
      message: "Login successful",
      // token: token, // Uncomment if JWT is returned
      user: { id: data.id, email: data.email },
    });
  });
};

