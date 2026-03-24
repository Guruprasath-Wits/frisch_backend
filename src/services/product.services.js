const sql = require("../helpers/db.js");

const Product = {};

Product.read = (callback) => {
    sql.query("SELECT product.*, category.min_delivery_charge, category.delivery_fee_weekday, category.delivery_fee_weekend, category.holiday_fee, category.category_type FROM product LEFT JOIN category ON product.category_id = category.id", (err, results) => {
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

Product.findById = (id, result) => {
    sql.query(`SELECT product.*, category.min_delivery_charge, category.delivery_fee_weekday, category.delivery_fee_weekend, category.holiday_fee, category.category_type FROM product LEFT JOIN category ON product.category_id = category.id WHERE product.id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found Product: ", res[0]);
            result(null, res[0]);
            return;
        }

        // no category found with the id
        result({ kind: "not_found" }, null);
    });
};


Product.create = (newProduct, result) => {
    // Ensure availability is stringified if it's an object/array
    if (newProduct.availability && typeof newProduct.availability !== 'string') {
        newProduct.availability = JSON.stringify(newProduct.availability);
    }

    sql.query("INSERT INTO product SET ?", newProduct, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created product: ", { id: res.insertId, ...newProduct });
        result(null, { id: res.insertId, ...newProduct });
    });
};



Product.edit = (id, updatedProduct, result) => {
    // Ensure availability is stringified if it's an object/array
    let availability = updatedProduct.availability;
    if (availability && typeof availability !== 'string') {
        availability = JSON.stringify(availability);
    }

    sql.query(
        "UPDATE product SET product_name = ?, nickname = ?, product_status = ?, product_img = ?, category_id = ?, `desc` = ?, price = ?, ingredients = ?, weight = ?, nutri_inform = ?, status = ?, availability = ?, pfand = ?, tax = ?, is_18_plus = ? WHERE id = ?",
        [
            updatedProduct.product_name,
            updatedProduct.nickname,
            updatedProduct.product_status,
            updatedProduct.product_img,
            updatedProduct.category_id,
            updatedProduct.desc,
            updatedProduct.price,
            updatedProduct.ingredients,
            updatedProduct.weight,
            updatedProduct.nutri_inform,
            updatedProduct.status,
            availability,
            updatedProduct.pfand,
            updatedProduct.tax,
            updatedProduct.is_18_plus,
            id,
        ],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                // No rows were affected, meaning the product was not found
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated product: ", { id: id, ...updatedProduct });
            result(null, { id: id, ...updatedProduct });
        }
    );
};



Product.delete = (id, result) => {
    const query = "DELETE FROM product WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("Category not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted category with id: ", id);
        result(null, { id: id });
    });
};







module.exports = Product;
