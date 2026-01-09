const sql = require("../helpers/db.js");

const coupontype = {};

coupontype.read = (callback) => {
    sql.query("SELECT * FROM coupontype", (err, results) => {
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

coupontype.findById = (id, result) => {
    sql.query(`SELECT * FROM coupontype WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found coupontype: ", res[0]);
            result(null, res[0]);
            return;
        }


        result({ kind: "not_found" }, null);
    });
};

coupontype.create = (newcoupontype, result) => {
    sql.query("INSERT INTO coupontype SET ?", newcoupontype, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created coupontype: ", { id: res.insertId, ...newcoupontype });
        result(null, { id: res.insertId, ...newcoupontype });
    });
};


coupontype.edit = (id, updatedcoupontype, result) => {
    const query = "UPDATE coupontype SET type = ?, description = ? WHERE id = ?";

    sql.query(query, [updatedcoupontype.type, updatedcoupontype.description, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("coupontype not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated coupontype: ", { id: id, ...updatedcoupontype });
        result(null, { id: id, ...updatedcoupontype });
    });
};

coupontype.delete = (id, result) => {
    const query = "DELETE FROM coupontype WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("coupontype not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted coupontype with id: ", id);
        result(null, { id: id });
    });
};




module.exports = coupontype;
