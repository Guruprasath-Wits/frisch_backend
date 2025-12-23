const sql = require("../helpers/db.js");

const card = {};

card.read = (callback) => {
    sql.query("SELECT * FROM cart", (err, results) => {
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

card.findById = (id, result) => {
    sql.query(`SELECT * FROM cart WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found card: ", res[0]);
            result(null, res[0]);
            return;
        }


        result({ kind: "not_found" }, null);
    });
};

card.findByUserId = (user_id, result) => {
    sql.query(`SELECT * FROM cart WHERE user_id = ?`, [user_id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            console.log("found card: ", res);
            result(null, res);
            return;
        }

        result({ kind: "not_found" }, null);
    });
};

card.create = (newcard, result) => {
    // sql.query("INSERT INTO cart SET ?", newcard, (err, res) => {
    //     if (err) {
    //         console.log("error: ", err);
    //         result(err, null);
    //         return;
    //     }

    //     console.log("created card: ", { id: res.insertId, ...newcard });
    //     result(null, { id: res.insertId, ...newcard });
    // });

    const user_id = newcard.user_id;
    const product_id = newcard.product_id;
    const quantity = newcard.quantity;

    sql.query(
        `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`,
        [user_id, product_id],
        (err, res) => {
            if (err) {
                console.log("Error checking existence: ", err);
                result(err, null);
                return;
            }

            if (res.length > 0) {
                console.log("Product already exists in the cart.");
                result({ message: "Product already exists in the cart." }, null);
                return;
            }

            sql.query("INSERT INTO cart SET ?", newcard, (err, res) => {
                if (err) {
                    console.log("Error inserting product: ", err);
                    result(err, null);
                    return;
                }

                console.log("Product added to cart: ", { id: res.insertId, ...newcard });
                result(null, { id: res.insertId, ...newcard });
            });
        }
    );
};


card.edit = (updatedcard, result) => {
    const query = "UPDATE cart SET quantity = ? WHERE id = ?";

    sql.query(query, [updatedcard.quantity, updatedcard.cart_id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("card not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated card: ", { ...updatedcard });
        result(null, { ...updatedcard });
    });
};

card.delete = (id, result) => {
    const query = "DELETE FROM cart WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("card not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted card with id: ", id);
        result(null, { id: id });
    });
};

card.deleteUserProduct = (id, result) => {
    const query = "DELETE FROM cart WHERE user_id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("card not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted card with id: ", id);
        result(null, { id: id });
    });
};




module.exports = card;