const sql = require("../helpers/db.js");

const MainCategory = {};

MainCategory.read = (callback) => {
    sql.query("SELECT * FROM main_category", (err, results) => {
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

MainCategory.findById = (id, result) => {
    sql.query(`SELECT * FROM main_category WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found main category: ", res[0]);
            result(null, res[0]);
            return;
        }

        result({ kind: "not_found" }, null);
    });
};

MainCategory.create = (newCategory, result) => {
    sql.query("INSERT INTO main_category SET ?", newCategory, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created main category: ", { id: res.insertId, ...newCategory });
        result(null, { id: res.insertId, ...newCategory });
    });
};

MainCategory.edit = (id, updatedCategory, result) => {
    const query = "UPDATE main_category SET category_name = ?, delivery_fee_weekday = ?, delivery_fee_weekend = ?, holiday_fee = ?, min_delivery_charge = ? WHERE id = ?";

    sql.query(query, [
        updatedCategory.category_name,
        updatedCategory.delivery_fee_weekday,
        updatedCategory.delivery_fee_weekend,
        updatedCategory.holiday_fee,
        updatedCategory.min_delivery_charge,
        id
    ], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("Main Category not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated main category: ", { id: id, ...updatedCategory });
        result(null, { id: id, ...updatedCategory });
    });
};

MainCategory.delete = (id, result) => {
    const query = "DELETE FROM main_category WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("Main Category not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted main category with id: ", id);
        result(null, { id: id });
    });
};

module.exports = MainCategory;
