const sql = require("../helpers/db.js");

const contactUs = {};

contactUs.read = (callback) => {
    sql.query("SELECT * FROM contactUs", (err, results) => {
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

contactUs.findById = (id, result) => {
    sql.query(`SELECT * FROM contactUs WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found contactUs: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

contactUs.create = (newcontactUs, result) => {
    sql.query("INSERT INTO contactUs SET ?", newcontactUs, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created contactUs: ", { id: res.insertId, ...newcontactUs });
        result(null, { id: res.insertId, ...newcontactUs });
    });
};


contactUs.edit = (id, updatedcontactUs, result) => {
    const query = "UPDATE contactUs SET contactUs_qns = ?, contactUs_ans = ? WHERE id = ?";

    sql.query(query, [updatedcontactUs.contactUs_qns, updatedcontactUs.contactUs_ans, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("contactUs not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated contactUs: ", { id: id, ...updatedcontactUs });
        result(null, { id: id, ...updatedcontactUs });
    });
};

contactUs.delete = (id, result) => {
    const query = "DELETE FROM contactUs WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("contactUs not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted contactUs with id: ", id);
        result(null, { id: id });
    });
};




module.exports = contactUs;
