const sql = require("../helpers/db.js");

const Tax = {};

Tax.read = (callback) => {
    sql.query("SELECT * FROM tax", (err, results) => {
        if (err) {
            console.log("error:", err);
            callback(err, null);
            return;
        }
        callback(null, results);
    });
};

Tax.findById = (id, result) => {
    sql.query(`SELECT * FROM tax WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
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

Tax.create = (newTax, result) => {
    sql.query("INSERT INTO tax SET ?", newTax, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, { id: res.insertId, ...newTax });
    });
};

Tax.edit = (id, updatedTax, result) => {
    const query = "UPDATE tax SET tax_name = ?, tax_value = ? WHERE id = ?";

    sql.query(query, [updatedTax.tax_name, updatedTax.tax_value, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("Tax not found");
            result(error, null);
            return;
        }
        result(null, { id: id, ...updatedTax });
    });
};

Tax.delete = (id, result) => {
    const query = "DELETE FROM tax WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("Tax not found");
            result(error, null);
            return;
        }
        result(null, { id: id });
    });
};

module.exports = Tax;
