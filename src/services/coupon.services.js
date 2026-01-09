const sql = require("../helpers/db.js");

const coupon = {};

coupon.read = (callback) => {
    sql.query("SELECT * FROM coupon", (err, results) => {
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

coupon.findById = (id, result) => {
    sql.query(`SELECT * FROM coupon WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found coupon: ", res[0]);
            result(null, res[0]);
            return;
        }


        result({ kind: "not_found" }, null);
    });
};

coupon.create = (newcoupon, result) => {
    sql.query("INSERT INTO coupon SET ?", newcoupon, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created coupon: ", { id: res.insertId, ...newcoupon });
        result(null, { id: res.insertId, ...newcoupon });
    });
};


coupon.edit = (id, updatedcoupon, result) => {
    const query = "UPDATE coupon SET type = ?, description = ?, subtype = ?, couponcode = ?, user = ?, status = ? WHERE id = ?";

    sql.query(query, [updatedcoupon.type, updatedcoupon.description, updatedcoupon.subtype, updatedcoupon.couponcode, updatedcoupon.user, updatedcoupon.status, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("coupon not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated coupon: ", { id: id, ...updatedcoupon});
        result(null, { id: id, ...updatedcoupon });
    });
};

coupon.delete = (id, result) => {
    const query = "DELETE FROM coupon WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("coupon not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted coupon with id: ", id);
        result(null, { id: id });
    });
};




module.exports = coupon;
