const sql = require("../helpers/db.js");

const Admin = function (admin) {
  this.email = admin.username;
  this.password = admin.password;

};

Admin.login = (email, result) => {
  sql.query("SELECT * FROM admins WHERE email = ?", [email], (err, res) => {
    if (err) {
      console.log("error:", err);
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

Admin.create = (newAdmin, result) => {
  sql.query("INSERT INTO admins SET ?", newAdmin, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    console.log("created admin: ", { id: res.insertId, ...newAdmin });
    result(null, { id: res.insertId, ...newAdmin });
  });
};

Admin.findPermissionsByRoleId = async (roleId) => {

  console.log('====================================');
  console.log(roleId);
  console.log('====================================');
  try {
    // Use a promise-based query to fetch permissions
    const [rows] = await sql
      .promise()
      .query(`SELECT * FROM permissions WHERE role_id = ?`, [roleId]);

    // Return the fetched permissions
    return rows;
  } catch (error) {
    console.error("Error in findPermissionsByRoleId:", error);
    throw new Error("Database query failed");
  }
};


Admin.read = (result) => {
  sql.query("SELECT * FROM admins", (err, results) => {
    if (err) {
      console.log("error:", err);
      result(err, null);
      return;
    }

    if (results.length === 0) {
      result({ kind: "not_found" }, null);
      return;
    }

    result(null, results);
  });
};


//  Admin.findPermissionsByRoleId = async (role_id) => {
//   const [rows] = await sql.promise().query('SELECT * FROM permissions WHERE role_id = ?', [role_id]);
//   return rows;
// };


// services/admin.services.js
Admin.savePermission = async (role_id, access) => {
  try {
    const query = `
      INSERT INTO permissions (
        role_id, Dashboard, Category, Main_Category, Sub_Category, Product, Customer_Enquiry, Coupon_Management, OrderList, Sample_Order,
        Our_Delivery_Areas, User_Advantages, Jobs, FAQ, Roles,
        Permissions, Subscription_Transactions, Steuer, Bottle, Users, Settings, Imprint, 
        Missing_Products, Combo_Packs, Holiday
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Dashboard = VALUES(Dashboard),
        Category = VALUES(Category),
        Main_Category = VALUES(Main_Category),
        Sub_Category = VALUES(Sub_Category),
        Product = VALUES(Product),
        Customer_Enquiry = VALUES(Customer_Enquiry),
        Coupon_Management = VALUES(Coupon_Management),
        OrderList = VALUES(OrderList),
        Sample_Order = VALUES(Sample_Order),
        Our_Delivery_Areas = VALUES(Our_Delivery_Areas),
        User_Advantages = VALUES(User_Advantages),
        Jobs = VALUES(Jobs),
        FAQ = VALUES(FAQ),
        Roles = VALUES(Roles),
        Permissions = VALUES(Permissions),
        Subscription_Transactions = VALUES(Subscription_Transactions),
        Steuer = VALUES(Steuer),
        Bottle = VALUES(Bottle),
        Users = VALUES(Users),
        Settings = VALUES(Settings),
        Imprint = VALUES(Imprint),
        Missing_Products = VALUES(Missing_Products),
        Combo_Packs = VALUES(Combo_Packs),
        Holiday = VALUES(Holiday);
    `;

    const values = [
      role_id,
      access.Dashboard ?? 1,
      access.Category ?? 0,
      access.Main_Category ?? 0,
      access.Sub_Category ?? 0,
      access.Product ?? 0,
      access.Customer_Enquiry ?? 0,
      access.Coupon_Management ?? 0,
      access.OrderList ?? 0,
      access.Sample_Order ?? 0,
      access.Our_Delivery_Areas ?? 0,
      access.User_Advantages ?? 0,
      access.Jobs ?? 0,
      access.FAQ ?? 0,
      access.Roles ?? 0,
      access.Permissions ?? 0,
      access.Subscription_Transactions ?? 0,
      access.Steuer ?? 1,
      access.Bottle ?? 1,
      access.Users ?? 0,
      access.Settings ?? 0,
      access.Imprint ?? 0,
      access.Missing_Products ?? 0,
      access.Combo_Packs ?? 0,
      access.Holiday ?? 0
    ];

    const [result] = await sql.promise().query(query, values);

    // If insert happened, insertId > 0. If it was an update, insertId === 0.
    return {
      insertId: result.insertId || null,
      affectedRows: result.affectedRows,
      // if you want the final row back, you can fetch it:
      // row: await Admin.findPermissionsByRoleId(role_id)
    };
  } catch (error) {
    console.error("Error saving permissions:", error);
    throw error;
  }
};





Admin.updatePermissions = async (role_id, access) => {
  try {
    const query = `
      UPDATE permissions 
      SET Dashboard = ?, Category = ?, Main_Category = ?, Sub_Category = ?, Product = ?, Customer_Enquiry = ?, Coupon_Management = ?, OrderList = ?, Sample_Order = ?, 
          Our_Delivery_Areas = ?, User_Advantages = ?, Jobs = ?, FAQ = ?, Roles = ?, 
          Permissions = ?, Subscription_Transactions = ?, Steuer = ?, Bottle = ?, Users = ?, Settings = ?, Imprint = ?, 
          Missing_Products = ?, Combo_Packs = ?, Holiday = ?
      WHERE role_id = ?
    `;
    const values = [
      access.Dashboard ?? 1, access.Category ?? 0, access.Main_Category ?? 0, access.Sub_Category ?? 0, access.Product ?? 0, access.Customer_Enquiry ?? 0, access.Coupon_Management ?? 0, access.OrderList ?? 0,
      access.Sample_Order ?? 0, access.Our_Delivery_Areas ?? 0, access.User_Advantages ?? 0, access.Jobs ?? 0,
      access.FAQ ?? 0, access.Roles ?? 0, access.Permissions ?? 0, access.Subscription_Transactions ?? 0, access.Steuer ?? 1, access.Bottle ?? 1, access.Users ?? 0, access.Settings ?? 0, access.Imprint ?? 0,
      access.Missing_Products ?? 0, access.Combo_Packs ?? 0, access.Holiday ?? 0,
      role_id
    ];
    const [result] = await sql.promise().query(query, values);
    return result;
  } catch (error) {
    console.error('Error updating permissions:', error);
    throw error;
  }
};

Admin.getAllPermissions = async () => {
  const [rows] = await sql.promise().query('SELECT * FROM permissions');
  return rows;
};

Admin.delete = async (id) => {
  try {
    const [res] = await sql.promise().query(
      "DELETE FROM permissions WHERE role_id = ?",
      [id]
    );
    return res.affectedRows; // Return number of rows deleted
  } catch (err) {
    throw err;
  }
};



Admin.edit = (id, updatedadmin, result) => {
  const query = "UPDATE admins SET  email = ?, password = ? WHERE id = ?";

  sql.query(query, [updatedadmin.email, updatedadmin.password, id], (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(err, null);
      return;
    }

    if (res.affectedRows === 0) {
      const error = new Error("admin not found");
      console.log("error: ", error.message);
      result(error, null);
      return;
    }

    console.log("updated admin: ", { id: id, ...updatedadmin });
    result(null, { id: id, ...updatedadmin });
  });
};







module.exports = Admin;
