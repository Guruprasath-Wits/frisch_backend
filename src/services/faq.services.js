const sql = require("../helpers/db.js");

const faq = {};

faq.read = (callback) => {
    sql.query("SELECT * FROM faq", (err, results) => {
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

faq.findById = (id, result) => {
    sql.query(`SELECT * FROM faq WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found faq: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

faq.create = (newfaq, result) => {
    sql.query("INSERT INTO faq SET ?", newfaq, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created faq: ", { id: res.insertId, ...newfaq });
        result(null, { id: res.insertId, ...newfaq });
    });
};


faq.edit = (id, updatedfaq, result) => {
    const query = "UPDATE faq SET faq_qns = ?, faq_ans = ? WHERE id = ?";

    sql.query(query, [updatedfaq.faq_qns, updatedfaq.faq_ans, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("faq not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated faq: ", { id: id, ...updatedfaq });
        result(null, { id: id, ...updatedfaq });
    });
};

faq.delete = (id, result) => {
    const query = "DELETE FROM faq WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("faq not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted faq with id: ", id);
        result(null, { id: id });
    });
};




module.exports = faq;
