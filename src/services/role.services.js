const sql = require("../helpers/db.js");

const role = {};

role.read = (callback) => {
    sql.query("SELECT * FROM roles", (err, results) => {
        if (err) {
            console.log("error:", err);
            callback(err, null);
            return;
        }

        if (results.length === 0) {
            callback({ kind: "not_found" }, null);
            return;
        }

        callback(null, results);
    });
};

role.findById = (id, result) => {
    sql.query(`SELECT * FROM roles WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found role: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

role.create = (newrole, result) => {
    // Check if role already exists
    sql.query("SELECT * FROM roles WHERE role_name = ?", [newrole.role_name], (err, res) => {
        if (err) {
            console.log("error: ", err);
            return result(err, null);
        }

        if (res.length > 0) {
            const error = new Error("role already exists");
            console.log("error: ", error.message);
            return result(error, null);
        }

        // If not exists, insert
        sql.query("INSERT INTO roles SET ?", newrole, (err, res) => {
            if (err) {
                console.log("error: ", err);
                return result(err, null);
            }

            console.log("created role: ", { id: res.insertId, ...newrole });
            result(null, { id: res.insertId, ...newrole });
        });
    });
};

role.edit = (id, updatedrole, result) => {
    // Check if new role_name already exists (but exclude the current role id)
    sql.query("SELECT * FROM roles WHERE role_name = ? AND id != ?", [updatedrole.role_name, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            return result(err, null);
        }

        if (res.length > 0) {
            const error = new Error("role already exists");
            console.log("error: ", error.message);
            return result(error, null);
        }

        const query = "UPDATE roles SET role_name = ? WHERE id = ?";
        sql.query(query, [updatedrole.role_name, id], (err, res) => {
            if (err) {
                console.log("error: ", err);
                return result(err, null);
            }

            if (res.affectedRows === 0) {
                const error = new Error("role not found");
                console.log("error: ", error.message);
                return result(error, null);
            }

            console.log("updated role: ", { id: id, ...updatedrole });
            result(null, { id: id, ...updatedrole });
        });
    });
};


role.delete = (id, result) => {
    const query = "DELETE FROM roles WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("role not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted role with id: ", id);
        result(null, { id: id });
    });
};




module.exports = role;
