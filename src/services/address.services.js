const sql = require("../helpers/db.js");

const address = {};

address.read = (callback) => {
    sql.query("SELECT * FROM address", (err, results) => {
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

address.findById = (id, result) => {
    sql.query(`SELECT * FROM address WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found address: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

address.create = (newaddress, result) => {
    sql.query("INSERT INTO address SET ?", newaddress, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created address: ", { id: res.insertId, ...newaddress });
        result(null, { id: res.insertId, ...newaddress });
    });
};


address.creates = (newaddress, result) => {
    sql.query("INSERT INTO paymentgateway SET ?", newaddress, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created address: ", { id: res.insertId, ...newaddress });
        result(null, { id: res.insertId, ...newaddress });
    });
};




address.delete = (id, result) => {
    const query = "DELETE FROM address WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("address not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted address with id: ", id);
        result(null, { id: id });
    });
};




module.exports = address;
