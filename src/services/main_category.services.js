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
    // First, get the current name of the main category to find its sub-categories
    sql.query("SELECT category_name FROM main_category WHERE id = ?", [id], (findErr, findRes) => {
        if (findErr) {
            console.log("error: ", findErr);
            result(findErr, null);
            return;
        }

        if (findRes.length === 0) {
            result({ kind: "not_found" }, null);
            return;
        }

        const oldCategoryName = findRes[0].category_name;

        // Ensure numeric values are properly handled
        const weekday_fee = parseFloat(updatedCategory.delivery_fee_weekday) || 0;
        const weekend_fee = parseFloat(updatedCategory.delivery_fee_weekend) || 0;
        const holiday_fee = parseFloat(updatedCategory.holiday_fee) || 0;
        const min_charge = parseFloat(updatedCategory.min_delivery_charge) || 0;

        const query = "UPDATE main_category SET category_name = ?, delivery_fee_weekday = ?, delivery_fee_weekend = ?, holiday_fee = ?, min_delivery_charge = ? WHERE id = ?";

        sql.query(query, [
            updatedCategory.category_name,
            weekday_fee,
            weekend_fee,
            holiday_fee,
            min_charge,
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

            // Sync changes to the category table (Sub-Categories)
            // Use TRIM to handle potential whitespace issues in the database
            const updateSubCategoriesQuery = `
                UPDATE category 
                SET category_type = ?, 
                    delivery_fee_weekday = ?, 
                    delivery_fee_weekend = ?, 
                    holiday_fee = ?, 
                    min_delivery_charge = ? 
                WHERE TRIM(category_type) = TRIM(?)`;

            sql.query(updateSubCategoriesQuery, [
                updatedCategory.category_name,
                weekday_fee,
                weekend_fee,
                holiday_fee,
                min_charge,
                oldCategoryName
            ], (subErr, subRes) => {
                if (subErr) {
                    console.log("Error updating sub-categories in sync:", subErr);
                    // We don't return an error here so the main update still counts as success,
                    // but on live this will now be visible in the console/logs
                } else {
                    console.log(`Successfully synced ${subRes.affectedRows} sub-categories for main category: ${updatedCategory.category_name}`);
                }

                console.log("Updated main category and triggered sync: ", { id: id, ...updatedCategory });
                result(null, { id: id, ...updatedCategory });
            });
        });
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
