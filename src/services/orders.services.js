const sql = require("../helpers/db.js");

const orders = {};

orders.read = (callback) => {
    sql.query("SELECT * FROM orders", (err, results) => {
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

orders.getUserById = async (userId) => {
    return new Promise((resolve, reject) => {
        sql.query(
            "SELECT username AS name, email FROM users WHERE id = ?",
            [userId],
            (err, results) => {
                if (err) return reject(err);
                if (!results || results.length === 0) return resolve(null);
                resolve(results[0]);
            }
        );
    });
};



orders.readByDriver = (driver_id, callback) => {
    const query = `
        SELECT * FROM processed_orders 
        WHERE driver_id = ?
    `;

    sql.query(query, [driver_id], (err, results) => {
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







orders.findById = (id, result) => {
    sql.query(`SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found orders: ", res[0]);
            result(null, res);
            return;
        }


        result({ kind: "not_found" }, null);
    });
};


orders.OrderDetailsRead = (id, result) => {
    sql.query(`SELECT * FROM orders_details WHERE order_id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found orders: ", res[0]);
            result(null, res);
            return;
        }


        result({ kind: "not_found" }, null);
    });
};


orders.create = (orderData, productDetails, iban) => {
    return new Promise((resolve, reject) => {

        function proceedWithOrderInsert() {
            sql.query("INSERT INTO orders SET ?", orderData, (err, res) => {
                if (err) {
                    console.log("Error inserting order:", err);
                    reject(err);
                    return;
                }
                const orderId = orderData.order_id;
                const promises = productDetails.map(([product_name, quantity, price]) => {
                    return new Promise((resolveProduct, rejectProduct) => {
                        sql.query(
                            "INSERT INTO orders_details (order_id, product_name, quantity, price) VALUES (?, ?, ?, ?)",
                            [orderId, product_name, quantity, price],
                            (err, res) => {
                                if (err) {
                                    console.log("Error inserting order detail:", err);
                                    rejectProduct(err);
                                } else {
                                    console.log("Order detail inserted:", {
                                        id: res.insertId,
                                        order_id: orderId,
                                        product_name,
                                        quantity,
                                        price,
                                    });
                                    resolveProduct({
                                        id: res.insertId,
                                        order_id: orderId,
                                        product_name,
                                        quantity,
                                        price,
                                    });
                                }
                            }
                        );
                    });
                });

                Promise.all(promises)
                    .then(productResults => {
                        resolve({
                            order: { id: res.insertId, ...orderData },
                            products: productResults,
                        });
                    })
                    .catch(error => {
                        console.log("Error inserting product details:", error);
                        reject(error);
                    });
            });
        }

        // Check for sample order duplicate if price is 0
        if (orderData.price === 0) {
            sql.query(
                "SELECT * FROM orders WHERE user_id = ? AND price = 0",
                [orderData.user_id],
                (orderErr, orderRows) => {
                    if (orderErr) {
                        reject(orderErr);
                        return;
                    }
                    if (orderRows.length !== 0) {
                        reject({ message: "Sample Order already exists for this user." });
                        return;
                    }
                    proceedWithOrderInsert();
                }
            );
        } else {
            proceedWithOrderInsert();
        }

    });
};


orders.updatePaymentStatus = (order_id, status, orderStatus) => {
    return new Promise((resolve, reject) => {
        sql.query(
            "UPDATE orders SET payment_status = ?, status = ? WHERE order_id = ?",
            [status, orderStatus, order_id],
            async (err, res) => {
                if (err) {
                    console.log("Error updating payment status:", err);
                    reject(err);
                    return;
                }

                if (res.affectedRows === 0) {
                    reject({ message: "Order not found" });
                    return;
                }

                // Fetch order and user details for email
                sql.query("SELECT * FROM orders WHERE order_id = ?", [order_id], (orderErr, orderRows) => {
                    if (orderErr || !orderRows || orderRows.length === 0) {
                        // Still resolve, but without email
                        return resolve({ order_id, status });
                    }
                    const order = orderRows[0];
                    // Ensure delivery_date is a string for email function
                    if (order && order.delivery_date && typeof order.delivery_date !== 'string') {
                        order.delivery_date = order.delivery_date.toISOString().slice(0, 10);
                    }
                    sql.query("SELECT * FROM orders_details WHERE order_id = ?", [order_id], (orderErr, orderDetailRows) => {
                        if (orderErr || !orderDetailRows || orderDetailRows.length === 0) {
                            // console.log("Order details not found for email sending", orderErr);
                            // Still resolve, but without email
                            return resolve({ order_id, status });
                        }
                        const productDetails = orderDetailRows.map(item => ([
                            item.product_name,
                            item.quantity,
                            item.price

                        ]));
                        sql.query("SELECT * FROM users WHERE id = ?", [order.user_id], async (userErr, userRows) => {
                            if (userErr || !userRows || userRows.length === 0) {
                                // console.log("User not found for email sending", userErr);
                                return resolve({ order_id, status });
                            }
                            const user = userRows[0];

                            // You may need to adjust the mail function and its arguments as per your actual implementation
                            try {
                                const mailServices = require('../helpers/mailServices.js');
                                // Example: orderConfirmMail(order, productDetails, user)
                                // You may need to fetch product details if needed
                                // console.log("Sending order confirmation email...", order, productDetails, user);
                                await mailServices.orderConfirmMail(order, productDetails, user);
                                // console.log("Order confirmation email sent");
                            } catch (mailErr) {
                                console.log("Error sending order confirmation email:", mailErr);
                            }
                            resolve({ order_id, status });
                        });
                    });
                });
            }
        );
    });
};


orders.subcreate = (orderData) => {
    return new Promise((resolve, reject) => {
        // Insert the main order into the database
        sql.query("INSERT INTO orders SET ?", orderData, (err, res) => {
            if (err) {
                console.log("Error inserting order:", err);
                reject(err);
                return;
            }

            // console.log("--------------------------------------------------------------------");
            // console.log("Order inserted:", { id: res.insertId, ...orderData });
            // console.log("--------------------------------------------------------------------");

            // Resolve the promise with the inserted order details
            resolve({
                order: { id: res.insertId, ...orderData },
            });
        });
    });
};





orders.edit = (id, updatedorders, result) => {
    sql.query(
        "UPDATE orders SET  status = ? WHERE id = ?",
        [
            updatedorders.status,
            id,
        ],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated orders: ", { id: id, ...updatedorders });
            result(null, { id: id, ...updatedorders });
        }
    );
};

orders.BagUpdate = (id, updatedorders, result) => {
    sql.query(
        "UPDATE orders SET  gro_bag = ?, mitt_bag = ?, bagu_bag = ?, zusätzliche_tüte = ? WHERE order_id = ?",
        [
            updatedorders.gro_bag,
            updatedorders.mitt_bag,
            updatedorders.bagu_bag,
            updatedorders.zusätzliche_tüte,

            id,
        ],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated orders: ", { id: id, ...updatedorders });
            result(null, { id: id, ...updatedorders });
        }
    );
};


orders.storeProcessedOrders = async (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) {
        console.error('No orders to process');
        return { insertedCount: 0, skippedCount: 0 };
    }

    const checkIfOrderExists = (order_id) => {
        return new Promise((resolve, reject) => {
            const checkQuery = 'SELECT COUNT(*) AS count FROM processed_orders WHERE order_id = ?';
            sql.query(checkQuery, [order_id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count > 0);
            });
        });
    };

    // Format only the date part (YYYY-MM-DD)
    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    };

    // Format full datetime (YYYY-MM-DD HH:mm:ss)
    const formatDateTime = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    let insertedCount = 0;
    let skippedCount = 0;

    // Sort orders by index_id in ascending order
    orders.sort((a, b) => a.index_id - b.index_id);

    const promises = orders.map(async (order) => {
        const {
            id, order_id, user_id, delivery_date, price, tips, address,
            contact, instruction, status, gro_bag, mitt_bag, bagu_bag,
            driver_id, created_at, lat, lng, payment_status, zipcode,
            zusätzliche_tüte, ort, index_id, driverName, distanceKm, estimatedTimeInMinutes, is_age_verified
        } = order;

        const exists = await checkIfOrderExists(order_id);
        if (exists) {
            console.log(`Skipping duplicate order_id: ${order_id}`);
            skippedCount++;
            return;
        }

        const sqlQuery = `
    INSERT INTO processed_orders (
      id, order_id, user_id, delivery_date, price, tips, address,
      contact, instruction, status, gro_bag, mitt_bag, bagu_bag,
      driver_id, created_at, lat, lng, payment_status, zipcode,
      zusätzliche_tüte, ort, index_id, driverName, distanceKm, estimatedTimeInMinutes, is_age_verified
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

        const values = [
            id, order_id, user_id, formatDate(delivery_date), price, tips, address,
            contact, instruction, status, gro_bag, mitt_bag, bagu_bag,
            driver_id, formatDateTime(created_at), lat, lng, payment_status, zipcode,
            zusätzliche_tüte, ort, index_id, driverName, distanceKm, estimatedTimeInMinutes, is_age_verified || 0
        ];

        return new Promise((resolve, reject) => {
            sql.query(sqlQuery, values, (err, result) => {
                if (err) {
                    console.error(`Error inserting order with ID ${order_id}:`, err);
                    return reject(err);
                }
                insertedCount++;
                resolve(result);
            });
        });
    });


    // const promises = orders.map(async (order, i) => {
    //   const {
    //     id, order_id, user_id, delivery_date, price, tips, address,
    //     contact, instruction, status, gro_bag, mitt_bag, bagu_bag,
    //     driver_id, created_at, lat, lng, payment_status, zipcode,
    //     zusätzliche_tüte, ort, driverName, distanceKm, estimatedTimeInMinutes
    //   } = order;

    //   const index_id = i + 1; // <-- incrementing index_id starting from 1

    //   const exists = await checkIfOrderExists(order_id);
    //   if (exists) {
    //     console.log(`Skipping duplicate order_id: ${order_id}`);
    //     skippedCount++;
    //     return;
    //   }

    //   const sqlQuery = `
    //     INSERT INTO processed_orders (
    //       id, order_id, user_id, delivery_date, price, tips, address,
    //       contact, instruction, status, gro_bag, mitt_bag, bagu_bag,
    //       driver_id, created_at, lat, lng, payment_status, zipcode,
    //       zusätzliche_tüte, ort, index_id, driverName, distanceKm, estimatedTimeInMinutes
    //     )
    //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    //   `;

    //   const values = [
    //     id, order_id, user_id, formatDate(delivery_date), price, tips, address,
    //     contact, instruction, status, gro_bag, mitt_bag, bagu_bag,
    //     driver_id, formatDateTime(created_at), lat, lng, payment_status, zipcode,
    //     zusätzliche_tüte, ort, index_id, driverName, distanceKm, estimatedTimeInMinutes
    //   ];

    //   return new Promise((resolve, reject) => {
    //     sql.query(sqlQuery, values, (err, result) => {
    //       if (err) {
    //         console.error(`Error inserting order with ID ${order_id}:`, err);
    //         return reject(err);
    //       }
    //       insertedCount++;
    //       resolve(result);
    //     });
    //   });
    // });


    try {
        await Promise.all(promises);
        console.log('All processed orders have been stored successfully');
        return { insertedCount, skippedCount };
    } catch (err) {
        console.error('Error storing processed orders:', err);
        throw err;
    }
};






orders.assignDriverToOrders = (driverId, orderIds, indexId, result) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return result({ kind: "invalid_data", message: "Order IDs must be a non-empty array." }, null);
    }

    const placeholders = orderIds.map(() => "?").join(", ");
    const query = `
    UPDATE orders 
    SET driver_id = ?, status = 'Assigned', index_id = ? 
    WHERE id IN (${placeholders})
  `;

    const queryValues = [driverId, indexId, ...orderIds];

    sql.query(query, queryValues, (err, res) => {
        if (err) {
            console.error("Error while updating orders:", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            result({ kind: "not_found", message: "No orders were found to update." }, null);
            return;
        }

        result(null, {
            driverId,
            orderIds,
            indexId,
            updatedRows: res.affectedRows,
        });
    });
};


// orders.assignDriverToOrders = (driverId, orderIds, result) => {
//     if (!Array.isArray(orderIds) || orderIds.length === 0) {
//         return result({ kind: "invalid_data", message: "Order IDs must be a non-empty array." }, null);
//     }

//     const placeholders = orderIds.map(() => "?").join(", ");
//     const query = `
//       UPDATE orders 
//       SET driver_id = ?, status = 'Assigned' 
//       WHERE id IN (${placeholders})
//     `;

//     const queryValues = [driverId, ...orderIds];

//     sql.query(query, queryValues, (err, res) => {
//         if (err) {
//             console.error("Error while updating orders:", err);
//             result(err, null);
//             return;
//         }

//         if (res.affectedRows === 0) {
//             result({ kind: "not_found", message: "No orders were found to update." }, null);
//             return;
//         }

//         result(null, {
//             driverId: driverId,
//             orderIds: orderIds,
//             updatedRows: res.affectedRows,
//         });

//     });
// };

orders.delete = (id, result) => {
    const query = "DELETE FROM orders WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("Orders not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted Orders with id: ", id);
        result(null, { id: id });
    });
};

orders.cancelOrder = (id, result) => {
    const query = "Update orders SET status = 'cancelling' where order_id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("Orders not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("Cancelling Orders with id: ", id);
        result(null, { id: id });
    });
};


//--------------------------------------------------------------------------

//APP



orders.OrderDetailsAllRead = (id, result) => {
    const query = ` SELECT * FROM orders_details WHERE status = 'uncollected' AND order_id IN ( SELECT order_id FROM orders WHERE driver_id = ?  AND status = 'Assigned'
    )
    `;

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.error("Error executing query:", err);
            result(err, null); // Pass the error to the callback
            return;
        }

        if (res.length) {
            console.log("Found orders:", res);
            result(null, res); // Pass the results to the callback
        } else {
            console.log("No orders found");
            result({ kind: "not_found" }, null); // No orders found
        }
    });
};


orders.datefetchAll = (id, date, callback) => {
    sql.query(
        "SELECT * FROM orders WHERE driver_id = ? AND delivery_date = ? AND ( status = 'Assigned' or status = 'completed' ) ",
        [id, date],
        (err, results) => {
            if (err) {
                console.error("SQL error:", err);
                callback(err, null);
                return;
            }

            if (results.length === 0) {
                callback({ kind: "not_found" }, null);
                return;
            }

            callback(null, results);
        }
    );
};

orders.datefetchComplete = (id, date, callback) => {
    sql.query(
        "SELECT * FROM orders WHERE driver_id = ? AND delivery_date = ? AND status = 'completed'",
        [id, date],
        (err, results) => {
            if (err) {
                console.error("SQL error:", err);
                callback(err, null);
                return;
            }

            if (results.length === 0) {
                callback({ kind: "not_found" }, null);
                return;
            }

            callback(null, results);
        }
    );
};



orders.timedistancefetchComplete = (id, date, callback) => {
    sql.query(
        "SELECT * FROM delivery_complete WHERE delivery_person_id = ? AND date = ?",
        [id, date],
        (err, results) => {
            if (err) {
                console.error("SQL error:", err);
                callback(err, null);
                return;
            }

            if (results.length === 0) {
                callback({ kind: "not_found" }, null);
                return;
            }

            callback(null, results);
        }
    );
};






//DeliveryComplete
orders.DeliveryComplete = (comDetail) => {
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO delivery_complete SET ?";

        // Perform database query
        sql.query(query, comDetail, (err, res) => {
            if (err) {
                console.error("Database error:", err);
                return reject(err); // Reject the promise with the error
            }

            // Resolve the promise with the response
            resolve(res);
        });
    });
};

orders.driverAll = (id, deli, result) => {
    sql.query(
        "SELECT * FROM delivery_complete WHERE delivery_person_id = ? and date = ?",
        [id, deli.date],
        (err, res) => {
            if (err) {
                console.log("Error: ", err);
                result(err, null);
                return;
            }

            if (res.length === 0) {
                result({ kind: "not_found" }, res);
                return;
            }

            console.log("Retrieved orders: ", res);
            result(null, res);
        }
    );
};



orders.totaltimeanddistance = (id, deli_orders, result) => {
    const query = `
        SELECT * FROM processed_orders 
        WHERE (STATUS = 'Assigned' OR STATUS = 'completed') 
        AND driver_id = ? AND delivery_date = ?
    `;

    sql.query(query, [id, deli_orders.date], (err, res) => {
        if (err) {
            console.error("Error executing query:", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("Found orders:", res);

            // Calculate total time and distance
            const estimatedTimeInMinutes = res.reduce((acc, order) => acc + (order.time || 0), 0);
            const distanceKm = res.reduce((acc, order) => acc + (order.distance || 0), 0);

            result(null, {
                orders: res,
                estimatedTimeInMinutes,
                distanceKm,
            });
        } else {
            console.log("No orders found");
            result({ kind: "not_found" }, null);
        }
    });
};




orders.insertOrUpdateDriverPerformance = (comDetail) => {
    return new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM driver_performance WHERE driver_id = ? AND delivery_date = ?";

        sql.query(checkQuery, [comDetail.driver_id, comDetail.delivery_date], (err, results) => {
            if (err) {
                console.error("Database error on select:", err);
                return reject(err);
            }

            if (results.length > 0) {
                const updateQuery = `
                    UPDATE driver_performance 
                    SET 
                        delivery_time = delivery_time + ?, 
                        delivery_distance = delivery_distance + ?, 
                        total_delivery = total_delivery + ?,
                        driverName = ?  -- ✅ update driverName too
                    WHERE driver_id = ? AND delivery_date = ?`;

                sql.query(updateQuery, [
                    comDetail.delivery_time,
                    comDetail.delivery_distance,
                    comDetail.total_delivery,
                    comDetail.driverName,
                    comDetail.driver_id,
                    comDetail.delivery_date
                ], (err, res) => {
                    if (err) {
                        console.error("Database error on update:", err);
                        return reject(err);
                    }
                    resolve({ message: "Record updated (values added)", data: res });
                });
            } else {
                const insertQuery = "INSERT INTO driver_performance SET ?";
                sql.query(insertQuery, comDetail, (err, res) => {
                    if (err) {
                        console.error("Database error on insert:", err);
                        return reject(err);
                    }
                    resolve({ message: "Record inserted", data: res });
                });
            }
        });
    });
};




orders.orderStatusUpdate = (id, status, result) => {

    // Step 1: Check Orders table
    sql.query(
        "SELECT * FROM orders WHERE order_id = ?",
        [id],
        (err, orderData) => {
            if (err) {
                console.log("error checking orders table: ", err);
                result(err, null);
                return;
            }

            if (orderData.length > 0) {
                // ============================
                // CASE 1: Found in orders table
                // ============================

                // Update orders
                sql.query(
                    "UPDATE orders SET status = ? WHERE order_id = ?",
                    [status, id],
                    (err1, res1) => {
                        if (err1) {
                            console.log("error updating orders: ", err1);
                            result(err1, null);
                            return;
                        }

                        // Update subscription
                        sql.query(
                            "UPDATE subscription SET status = ? WHERE order_id = ?",
                            [status, id],
                            (err2, res2) => {
                                if (err2) {
                                    console.log("error updating subscription: ", err2);
                                    result(err2, null);
                                    return;
                                }

                                // Update processed_orders
                                sql.query(
                                    "UPDATE processed_orders SET status = ? WHERE order_id = ?",
                                    [status, id],
                                    (err3, res3) => {
                                        if (err3) {
                                            console.log("error updating processed_orders: ", err3);
                                            result(err3, null);
                                            return;
                                        }

                                        result(null, {
                                            id,
                                            status,
                                            found_in: "orders",
                                            orders_updated: res1.affectedRows,
                                            subscription_updated: res2.affectedRows,
                                            processed_orders_updated: res3.affectedRows
                                        });
                                    }
                                );
                            }
                        );
                    }
                );

            } else {
                // ============================
                // CASE 2: Not found in orders → check subscription
                // ============================

                sql.query(
                    "SELECT * FROM subscription WHERE order_id = ?",
                    [id],
                    (errSubCheck, subData) => {
                        if (errSubCheck) {
                            console.log("error checking subscription table: ", errSubCheck);
                            result(errSubCheck, null);
                            return;
                        }

                        if (subData.length === 0) {
                            // Not found in both tables
                            result({ kind: "not_found" }, null);
                            return;
                        }

                        // ----------------------------
                        // CASE 2A: Found only in subscription table
                        // ----------------------------

                        // Update subscription table
                        sql.query(
                            "UPDATE subscription SET status = ? WHERE order_id = ?",
                            [status, id],
                            (err4, res4) => {
                                if (err4) {
                                    console.log("error updating subscription: ", err4);
                                    result(err4, null);
                                    return;
                                }

                                // Update processed_orders table
                                sql.query(
                                    "UPDATE processed_orders SET status = ? WHERE order_id = ?",
                                    [status, id],
                                    (err5, res5) => {
                                        if (err5) {
                                            console.log("error updating processed_orders: ", err5);
                                            result(err5, null);
                                            return;
                                        }

                                        result(null, {
                                            id,
                                            status,
                                            found_in: "subscription",
                                            subscription_updated: res4.affectedRows,
                                            processed_orders_updated: res5.affectedRows
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        }
    );
};



// orders.orderStatusUpdate = (id, status, result) => {
//     // First, update the orders table
//     sql.query(
//         "UPDATE orders SET status = ? WHERE order_id = ?",
//         [status, id],
//         (err, res) => {
//             if (err) {
//                 console.log("error updating orders table: ", err);
//                 result(err, null);
//                 return;
//             }

//             if (res.affectedRows == 0) {
//                 result({ kind: "not_found" }, null);
//                 return;
//             }

//             // Now update the processed_orders table
//             sql.query(
//                 "UPDATE processed_orders SET status = ? WHERE order_id = ?",
//                 [status, id],
//                 (err2, res2) => {
//                     if (err2) {
//                         console.log("error updating processed_orders table: ", err2);
//                         result(err2, null);
//                         return;
//                     }

//                     // Both updates successful
//                     result(null, {
//                         id: id,
//                         status: status,
//                         orders_updated: res.affectedRows,
//                         processed_orders_updated: res2.affectedRows
//                     });
//                 }
//             );
//         }
//     );
// };



//deliverycompleteAll


orders.deliverycompleteAll = (result) => {
    sql.query(
        "SELECT * FROM delivery_complete",

        (err, res) => {
            if (err) {
                console.log("Error: ", err);
                result(err, null);
                return;
            }

            if (res.length === 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("Retrieved orders: ", res);
            result(null, res);
        }
    );
};

orders.driverhistory = (id, result) => {
    sql.query(
        "SELECT * FROM delivery_complete WHERE delivery_person_id = ? ",
        [id],
        (err, res) => {
            if (err) {
                console.log("Error: ", err);
                result(err, null);
                return;
            }

            if (res.length === 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("Retrieved orders: ", res);
            result(null, res);
        }
    );
};

orders.driverperformanceRead = (result) => {
    sql.query(
        "SELECT * FROM  driver_performance",
        //  [id],
        (err, res) => {
            if (err) {
                console.log("Error: ", err);
                result(err, null);
                return;
            }

            if (res.length === 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("Retrieved orders: ", res);
            result(null, res);
        }
    );
};


orders.orderdeli = (deli_orders, result) => {
    sql.query(
        "SELECT * FROM orders WHERE driver_id = ? AND status = ?",
        [deli_orders.id, deli_orders.status],
        (err, res) => {
            if (err) {
                console.log("Error: ", err);
                result(err, null);
                return;
            }

            if (res.length === 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("Retrieved orders: ", res);
            result(null, res);
        }
    );
};


//warehouseDelete

orders.warehouseDelete = (id, status, result) => {
    sql.query(
        "update `orders_details` set status='collected' WHERE order_id IN (SELECT order_id FROM `orders`  WHERE driver_id = ? AND status = ?);",
        [
            id,
            status
        ],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            console.log("updated orders: ", { id: id });
            result(null, { id: id });
        }
    );
};







module.exports = orders;