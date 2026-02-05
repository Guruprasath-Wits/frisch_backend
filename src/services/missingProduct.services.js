const sql = require("../helpers/db.js");

const MissingProduct = {};

MissingProduct.create = (newMissingProduct, result) => {
    sql.query("INSERT INTO missing_product SET ?", newMissingProduct, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created missing_product: ", { id: res.insertId, ...newMissingProduct });
        result(null, { id: res.insertId, ...newMissingProduct });
    });
};

MissingProduct.getAll = (result) => {
    sql.query("SELECT * FROM missing_product ORDER BY is_read ASC, created_at DESC", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        console.log("missing_product: ", res);
        result(null, res);
    });
};

MissingProduct.markAsRead = (id, result) => {
    sql.query("UPDATE missing_product SET is_read = 1 WHERE id = ?", [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }

        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }

        console.log("updated missing_product: ", { id: id, is_read: 1 });
        result(null, { id: id, is_read: 1 });
    });
};

module.exports = MissingProduct;
