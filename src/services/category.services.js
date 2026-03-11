const sql = require("../helpers/db.js");

const Category = {};

Category.read = (callback) => {
    sql.query("SELECT * FROM category", (err, results) => {
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

Category.findById = (id, result) => {
    sql.query(`SELECT * FROM category WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found category: ", res[0]);
            result(null, res[0]);
            return;
        }

        // no category found with the id
        result({ kind: "not_found" }, null);
    });
};

Category.create = (newCategory, result) => {
    sql.query("INSERT INTO category SET ?", newCategory, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created category: ", { id: res.insertId, ...newCategory });
        result(null, { id: res.insertId, ...newCategory });
    });
};


Category.edit = (id, updatedCategory, result) => {
    const query = "UPDATE category SET category_name = ?,category_type = ?,category_desc = ?, category_img = ?, delivery_fee_weekday = ?, delivery_fee_weekend = ?, holiday_fee = ?, min_delivery_charge = ? WHERE id = ?";

    sql.query(query, [
        updatedCategory.category_name,
        updatedCategory.category_type,
        updatedCategory.category_desc,
        updatedCategory.category_img,
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
            // No category found with the given ID
            const error = new Error("Category not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated category: ", { id: id, ...updatedCategory });
        result(null, { id: id, ...updatedCategory });
    });
};

Category.delete = (id, result) => {
    const query = "DELETE FROM category WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            // No category found with the given ID
            const error = new Error("Category not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted category with id: ", id);
        result(null, { id: id });
    });
};




module.exports = Category;
