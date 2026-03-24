const sql = require("../helpers/db.js");

const User = function (user) {
  this.username = user.username;
  this.password = user.password;
  this.email = user.email;
  this.phone = user.phone;
  this.address = user.address;
  this.street = user.street;
  this.subarb = user.subarb;
  this.zipcode = user.zipcode;
  this.ort = user.ort;
  this.dob = user.dob;
  this.acc_no = user.acc_no;
  this.ban_no = user.ban_no;
  this.bc_no = user.bc_no;
  this.role = user.role;
  this.role_id = user.role_id || 4;
  this.lift_availability = user.lift_availability;
  this.floor = user.floor;
  this.company_name = user.company_name;
  this.status = user.status;
};
User.create = (newUser, result) => {
  if (!newUser.role_id) {
    return result({ message: "role_id is required before inserting user" }, null);
  }

  sql.query(
    "SELECT id FROM users WHERE LOWER(email) = ?",
    [newUser.email.toLowerCase()],
    (err, existing) => {
      if (err) return result(err, null);

      if (existing.length > 0) {
        return result({ message: `User with email '${newUser.email}' already exists` }, null);
      }

      console.log("Inserting user into DB:", newUser);

      sql.query("INSERT INTO users SET ?", newUser, (err, resUser) => {
        if (err) return result(err, null);

        // special case: if admin, also add to admins table
        if (newUser.role_id === 1) {
          const adminData = {
            email: newUser.email,
            password: newUser.password,
            role_id: newUser.role_id
          };
          sql.query("INSERT INTO admins SET ?", adminData, (err) => {
            if (err) return result(err, null);
            result(null, { id: resUser.insertId, ...newUser });
          });
        } else {
          result(null, { id: resUser.insertId, ...newUser });
        }
      });
    }
  );
};









User.login = (email, result) => {
  sql.query(
    "SELECT * FROM users WHERE email = ? AND status = 1",
    [email],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }
      if (res.length) {
        result(null, res[0]);
        return;
      }
      result({ kind: "not_found" }, null);
    }
  );
};


User.updateStatusById = (id, status, result) => {
  sql.query(
    "UPDATE users SET status = ? WHERE id = ?",
    [status, id],
    (err, res) => {
      if (err) {
        result(err, null);
        return;
      }

      if (res.affectedRows == 0) {
        // No user found with that id
        result({ kind: "not_found" }, null);
        return;
      }

      result(null, { id: id, status: status });
    }
  );
};


User.read = (result) => {
  sql.query("SELECT * FROM users ORDER BY id DESC", (err, results) => {
    if (err) {
      result(err, null);
      return;
    }
    result(null, results);
  });
};

User.readById = (id, result) => {
  sql.query("SELECT * FROM users WHERE id = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.length) {
      result(null, res[0]);
      return;
    }
    result({ kind: "not_found" }, null);
  });
};

User.update = (id, userUpdates, result) => {
  sql.query("UPDATE users SET ? WHERE id = ?", [userUpdates, id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, { id: id, ...userUpdates });
  });
};


User.delete = (id, result) => {
  sql.query("DELETE FROM users WHERE id = ?", [id], (err, res) => {
    if (err) {
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
      return;
    }
    result(null, res);
  });
};

//---------------------------------------------


User.loginapp = ([email, password], result) => {
  sql.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password], // Corrected SQL query to match parameters properly
    (err, res) => {
      if (err) {
        console.error("Error querying database:", err); // Log error for debugging
        result(err, null);
        return;
      }

      if (res.length) {
        result(null, res[0]);
        return;
      }

      result({ kind: "not_found" }, null);
    }
  );
};

module.exports = User;
