const sql = require("../helpers/db.js");

const sampleOrder = {};


sampleOrder.read = (callback) => {
    const query = `
    SELECT 
        so.id AS sample_order_id,
        so.desc,
        so.description,
        so.product_img,
        sop.product_id,
        sop.product_name
    FROM sample_order so
    LEFT JOIN sample_order_products sop ON sop.sample_order_id = so.id;
    `;

    sql.query(query, (err, results) => {
        if (err) {
            console.log("error:", err);
            callback(err, null);
            return;
        }

        const grouped = [];
        const map = new Map();

        results.forEach(row => {
            if (!map.has(row.sample_order_id)) {
                map.set(row.sample_order_id, {
                    id: row.sample_order_id,
                    desc: row.desc,
                    description: row.description,
                    product_img: row.product_img,  // ✅ Include product_img
                    products: []
                });
                grouped.push(map.get(row.sample_order_id));
            }

            if (row.product_id) {
                map.get(row.sample_order_id).products.push({
                    id: row.product_id,
                    name: row.product_name
                });
            }
        });

        callback(null, grouped);
    });
};




// sampleOrder.read = (callback) => {
//     const query = `
//         SELECT 
//             GROUP_CONCAT(product_id) AS products,
//             description,
//             \desc\
//         FROM 
//             sample_order
//         GROUP BY 
//             \desc\, description
//     `;

//     sql.query(query, (err, results) => {
//         if (err) {
//             console.log("error:", err);
//             callback(err, null);
//             return;
//         }

//         if (results.length === 0) {
//             callback({ kind: "not_found" }, null);
//             return;
//         }

//         const formattedResults = results.map(row => ({
//             desc: row.desc,
//             description: row.description,
//             products: row.products ? row.products.split(',').map(Number) : []
//         }));

//         callback(null, formattedResults);
//     });
// };



// sampleOrder.read = (callback) => {
//     sql.query("SELECT * FROM sample_order", (err, results) => {
//         if (err) {
//             console.log("error:", err);
//             callback(err, null);
//             return;
//         }

//         if (results.length === 0) {
//             callback({ kind: "not_found" }, null);
//             return;
//         }

//         callback(null, results);
//     });
// };

sampleOrder.findById = (id, result) => {
    const query = `
    SELECT 
        so.id AS sample_order_id,
        so.desc,
        so.description,
        so.product_img,
        sop.product_id,
        sop.product_name
    FROM sample_order so
    LEFT JOIN sample_order_products sop ON sop.sample_order_id = so.id
    WHERE so.id = ?
    `;

    sql.query(query, [id], (err, results) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (!results.length) {
            return result({ kind: "not_found" }, null);
        }

        // Group result for single record
        const row = results[0];
        const grouped = {
            id: row.sample_order_id,
            desc: row.desc,
            description: row.description,
            product_img: row.product_img,
            products: []
        };

        results.forEach(r => {
            if (r.product_id) {
                grouped.products.push({
                    id: r.product_id,
                    name: r.product_name
                });
            }
        });

        result(null, grouped);
    });
};


sampleOrder.create = (desc, description, product_img, products, result) => {
    const insertOrder = "INSERT INTO sample_order (`desc`, description, product_img) VALUES (?, ?, ?)";

    sql.query(insertOrder, [desc, description, product_img], (err, res1) => {
        if (err) return result(err, null);

        const orderId = res1.insertId;
        const productValues = products.map(p => [orderId, p.id, p.name]);

        if (productValues.length === 0) {
            return result(null, { id: orderId, desc, description, product_img, products });
        }

        const insertProducts = "INSERT INTO sample_order_products (sample_order_id, product_id, product_name) VALUES ?";
        sql.query(insertProducts, [productValues], (err2) => {
            if (err2) return result(err2, null);
            result(null, { id: orderId, desc, description, product_img, products });
        });
    });
};


sampleOrder.edit = (id, updatedData, result) => {
    
    const updateQuery = `
        UPDATE sample_order 
        SET 
           \`desc\` = ?, 
            description = ?, 
            product_img = ?
        WHERE id = ?
    `;

    sql.query(updateQuery, [updatedData.desc, updatedData.description, updatedData.product_img, id], (err, res1) => {
        if (err) return result(err, null);
        
        if (res1.affectedRows === 0) {
            return result({ message: "sampleOrder not found" }, null);
        }

        // Update products separately if needed (example: clear & insert)
        const productValues = updatedData.products.map(p => [id, p.id, p.name]);

        const deleteQuery = "DELETE FROM sample_order_products WHERE sample_order_id = ?";
        sql.query(deleteQuery, [id], (err2) => {
            if (err2) return result(err2, null);

            if (productValues.length === 0) return result(null, updatedData);

            const insertProducts = "INSERT INTO sample_order_products (sample_order_id, product_id, product_name) VALUES ?";
            sql.query(insertProducts, [productValues], (err3) => {
                if (err3) return result(err3, null);
                result(null, updatedData);
            });
        });
    });
};

// sampleOrder.edit = (id, updatedsampleOrder, result) => {
//     const query = "UPDATE sample_order SET product_id = ?, desc = ?, description = ?, status = ? WHERE id = ?";

//     sql.query(query, [updatedsampleOrder.product_id, updatedsampleOrder.desc, updatedsampleOrder.description, updatedsampleOrder.status, id], (err, res) => {
//         if (err) {
//             console.log("error: ", err);
//             result(err, null);
//             return;
//         }

//         if (res.affectedRows === 0) {
//             const error = new Error("sampleOrder not found");
//             console.log("error: ", error.message);
//             result(error, null);
//             return;
//         }

//         console.log("updated sampleOrder: ", { id: id, ...updatedsampleOrder });
//         result(null, { id: id, ...updatedsampleOrder });
//     });
// };

// sampleOrder.delete = (id, result) => {
//     const query = "DELETE FROM sample_order WHERE id = ?";

//     sql.query(query, [id], (err, res) => {
//         if (err) {
//             console.log("error: ", err);
//             result(err, null);
//             return;
//         }

//         if (res.affectedRows === 0) {
            
//             const error = new Error("sampleOrder not found");
//             console.log("error: ", error.message);
//             result(error, null);
//             return;
//         }

//         console.log("deleted sampleOrder with id: ", id);
//         result(null, { id: id });
//     });
// };

sampleOrder.delete = (id, result) => {
    const query = "DELETE FROM sample_order WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) return result(err, null);
        result(null, { message: "Sample Order deleted" });
    });
};





module.exports = sampleOrder;