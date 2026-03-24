const sql = require("../helpers/db.js");

const userAdv = {};

userAdv.read = (callback) => {
    sql.query("SELECT * FROM user_advantages", (err, results) => {
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

userAdv.findById = (id, result) => {
    sql.query(`SELECT * FROM user_advantages WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found userAdv: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

userAdv.create = (newuserAdv, result) => {
    sql.query("INSERT INTO user_advantages SET ?", newuserAdv, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created userAdv: ", { id: res.insertId, ...newuserAdv });
        result(null, { id: res.insertId, ...newuserAdv });
    });
};


userAdv.edit = (id, updateduserAdv, result) => {
    const query = "UPDATE user_advantages SET adv_qns = ?, adv_ans = ? WHERE id = ?";

    sql.query(query, [updateduserAdv.adv_qns, updateduserAdv.adv_ans, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("userAdv not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated userAdv: ", { id: id, ...updateduserAdv });
        result(null, { id: id, ...updateduserAdv });
    });
};

userAdv.delete = (id, result) => {
    const query = "DELETE FROM user_advantages WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("userAdv not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted userAdv with id: ", id);
        result(null, { id: id });
    });
};




module.exports = userAdv;
