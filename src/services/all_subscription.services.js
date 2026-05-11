const sql = require("../helpers/db.js");
const bcrypt = require('bcryptjs');

const orders = {};

orders.read = (callback, id) => {
    sql.query(
        "SELECT * FROM all_subscription WHERE user_id = ? AND status = 1",
        [id],
        (err, results) => {
            if (err) {
                console.log("Error while fetching subscription:", err);
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
orders.readAll = (callback, id) => {
    sql.query(
        "SELECT * FROM all_subscription WHERE status = 1",
        [id],
        (err, results) => {
            if (err) {
                console.log("Error while fetching subscription:", err);
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


// orders.read = (callback, id) => {
//     sql.query("SELECT * FROM all_subscription WHERE user_id? and status = 1", [id], (err, results) => {
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

orders.findById = (id, result) => {
    sql.query(`SELECT * FROM all_subscription WHERE user_id = ? AND status = 1`, [id], (err, res) => {
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

orders.findByOrderId = (id, result) => {
    sql.query(`SELECT * FROM all_subscription WHERE order_id = ?`, [id], (err, res) => {
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
// commend on 27-09-25
// orders.create = (orderData, productDetails, iban) => {
//     return new Promise((resolve, reject) => {
//         // Step 1: Update user's bank number
//         sql.query("UPDATE users SET ban_no = ? WHERE id = ? ", [iban, orderData.user_id], (err, updateRes) => {
//             if (err) {
//                 console.error("Updation Failed!!!", err);
//                 reject(err);
//                 return;
//             }

//             // Step 2: Insert main order after update is successful
//             sql.query("INSERT INTO all_subscription SET ?", orderData, (err, insertRes) => {
//                 if (err) {
//                     console.error("Error inserting order:", err);
//                     reject(err);
//                     return;
//                 }
//      const orderId = orderData.order_id;
//             const promises = productDetails.map(([product_name, quantity, price]) => {
//                 // console.log("==================================================================")
//                 // console.log(productDetails)
//                 // console.log("==================================================================")
//                 return new Promise((resolveProduct, rejectProduct) => {
//                     sql.query(
//                         "INSERT INTO orders_details SET order_id = ?, product_name = ?, quantity = ?, price = ?",
//                         [orderId, product_name, quantity, price],
//                         (err, res) => {
//                             if (err) {
//                                 console.log("Error inserting order detail:", err);
//                                 rejectProduct(err);
//                             } else {
//                                 console.log("Order detail inserted:", {
//                                     id: res.insertId,
//                                     order_id: orderId,
//                                     product_name,
//                                     quantity,
//                                 });
//                                 resolveProduct({
//                                     id: res.insertId,
//                                     order_id: orderId,
//                                     product_name,
//                                     quantity,
//                                 });
//                             }
//                         }
//                     );
//                 });
//             });
//                 // Return the newly inserted order ID or some success message
//                 resolve({
//                     message: "Order created successfully.",
//                     orderId: insertRes.insertId
//                 });
//             });
//         });
//     });
// };

orders.create = (orderData, productDetails) => {
  return new Promise((resolve, reject) => {
    // Step 1: Determine which user fields to update
    let updateQuery = "";
    let updateParams = [];

    if (orderData.paymentType === "SEPA" && orderData.iban) {
      updateQuery = "UPDATE users SET ban_no = ? WHERE id = ?";
      updateParams = [orderData.iban, orderData.user_id];
    } else if (orderData.paymentType === "PAYPAL" && orderData.paymentId && orderData.typeId) {
      updateQuery = "UPDATE users SET paypal_payment_id = ?, paypal_type_id = ? WHERE id = ?";
      updateParams = [orderData.paymentId, orderData.typeId, orderData.user_id];
    }

    const updateUser = () => {
      if (!updateQuery) return Promise.resolve(); // nothing to update

      return new Promise((resolveUpdate, rejectUpdate) => {
        sql.query(updateQuery, updateParams, (err, res) => {
          if (err) {
            console.error("User update failed:", err);
            return rejectUpdate(err);
          }
          resolveUpdate(res);
        });
      });
    };

    // Step 2: Update user (SEPA or PayPal)
    updateUser()
      .then(() => {
        // Step 3: Insert main subscription order
        sql.query("INSERT INTO all_subscription SET ?", orderData, (err, insertRes) => {
          if (err) {
            console.error("Error inserting order:", err);
            return reject(err);
          }

          const orderId = orderData.order_id;

          // Step 4: Insert each product detail
          const promises = productDetails.map(([product_name, quantity, price]) => {
            return new Promise((resolveProduct, rejectProduct) => {
              sql.query(
                "INSERT INTO orders_details SET order_id = ?, product_name = ?, quantity = ?, price = ?",
                [orderId, product_name, quantity, price],
                (err, res) => {
                  if (err) return rejectProduct(err);
                  resolveProduct({
                    id: res.insertId,
                    order_id: orderId,
                    product_name,
                    quantity,
                  });
                }
              );
            });
          });

          // Step 5: Wait for all product insertions and resolve
          Promise.all(promises)
            .then((products) => {
              resolve({
                message: "Order created successfully.",
                orderId: insertRes.insertId,
                products,
              });
            })
            .catch(reject);
        });
      })
      .catch(reject);
  });
};



// orders.create = (orderData, productDetails, iban) => {
//     return new Promise((resolve, reject) => {

//         sql.query("UPDATE users SET ban_no = ? WHERE id = ?", [iban, orderData.user_id], (err, res) => {
//             if (err) {
//                 console.log("Updation Failed!!!", err);
//             }
//         })

//         // Step 1: Insert main order
//         sql.query("INSERT INTO all_subscription SET ?", orderData, (err, res) => {
//             if (err) {
//                 console.log("Error inserting order:", err);
//                 reject(err);
//                 return;
//             }
//             console.log("--------------------------------------------------------------------")
//             console.log("Order inserted:", { id: res.insertId, ...orderData });
//             console.log("--------------------------------------------------------------------")

//             // Step 2: Insert product details
//             // const orderId = orderData.order_id;
//             // const promises = productDetails.map(([product_name, quantity]) => {
//             //     console.log("==================================================================")
//             //     console.log(productDetails)
//             //     console.log("==================================================================")
//             //     return new Promise((resolveProduct, rejectProduct) => {
//             //         sql.query(
//             //             "INSERT INTO orders_details SET order_id = ?, product_name = ?, quantity = ?",
//             //             [orderId, product_name, quantity],
//             //             (err, res) => {
//             //                 if (err) {
//             //                     console.log("Error inserting order detail:", err);
//             //                     rejectProduct(err);
//             //                 } else {
//             //                     console.log("Order detail inserted:", {
//             //                         id: res.insertId,
//             //                         order_id: orderId,
//             //                         product_name,
//             //                         quantity,
//             //                     });
//             //                     resolveProduct({
//             //                         id: res.insertId,
//             //                         order_id: orderId,
//             //                         product_name,
//             //                         quantity,
//             //                     });
//             //                 }
//             //             }
//             //         );
//             //     });
//             // });

//             // // Wait for all product insertions to complete
//             // Promise.all(promises)
//             //     .then(productResults => {
//             //         resolve({
//             //             order: { id: res.insertId, ...orderData },
//             //             products: productResults,
//             //         });
//             //     })
//             //     .catch(error => {
//             //         console.log("Error inserting product details:", error);
//             //         reject(error);
//             //     });
//         });
//     });
// }


orders.edit = (id, updatedorders, result) => {
    sql.query(
        "UPDATE all_subscription SET  status = ? WHERE id = ?",
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

// orders.updateSubscribe = (id, updatedorders, product, result) => {
//     sql.beginTransaction((err) => {
//         if (err) {
//             console.error("Transaction Error:", err);
//             result(err, null);
//             return;
//         }

//         // Update the all_subscription
//         sql.query(
//             "UPDATE all_subscription SET price = ? WHERE order_id = ?",
//             [updatedorders.price, id],
//             (err, res) => {
//                 if (err) {
//                     console.error("Error updating all_subscription:", err);
//                     sql.rollback(() => {
//                         result(err, null);
//                     });
//                     return;
//                 }

//                 if (res.affectedRows == 0) {
//                     sql.rollback(() => {
//                         result({ kind: "not_found" }, null);
//                     });
//                     return;
//                 }

//                 // Insert into orders_details
//                 sql.query(
//                     "INSERT INTO orders_details SET order_id = ?, product_name = ?, quantity = ?",
//                     [product.order_id, product.product_name, product.quantity],
//                     (err, res) => {
//                         if (err) {
//                             console.error("Error inserting order detail:", err);
//                             sql.rollback(() => {
//                                 result(err, null);
//                             });
//                             return;
//                         }

//                         // Commit the transaction
//                         sql.commit((err) => {
//                             if (err) {
//                                 console.error("Error committing transaction:", err);
//                                 sql.rollback(() => {
//                                     result(err, null);
//                                 });
//                                 return;
//                             }

//                             console.log("Order detail inserted successfully:", {
//                                 id: res.insertId,
//                                 ...product,
//                             });
//                             result(null, { id: id, ...updatedorders });
//                         });
//                     }
//                 );
//             }
//         );
//     });
// };

orders.updateSubscribe = (id, updatedorders, product, result) => {
    // Step 1: Update price in all_subscription
    sql.query(
        "UPDATE all_subscription SET price = ? WHERE order_id = ?",
        [updatedorders.price, id],
        (err, res) => {
            if (err) {
                console.error("Error updating all_subscription:", err);
                result(err, null);
                return;
            }

            if (res.affectedRows === 0) {
                result({ kind: "not_found" }, null);
                return;
            }

            // Step 2: Check if product already exists in orders_details
            // sql.query(
            //     "SELECT * FROM orders_details WHERE order_id = ? AND product_name = ?",
            //     [product.order_id, product.product_name],
            //     (err, rows) => {
            //         if (err) {
            //             console.error("Error checking existing product:", err);
            //             result(err, null);
            //             return;
            //         }

            //         if (rows.length > 0) {
            //             // Product exists, update the quantity
            //             const existingQty = rows[0].quantity;
            //             const newQty =  product.quantity;

            //             sql.query(
            //                 "UPDATE orders_details SET quantity = ? WHERE order_id = ? AND product_name = ?",
            //                 [newQty, product.order_id, product.product_name],
            //                 (err, updateRes) => {
            //                     if (err) {
            //                         console.error("Error updating product quantity:", err);
            //                         result(err, null);
            //                         return;
            //                     }

            //                     result(null, { id: id, ...updatedorders });
            //                 }
            //             );
            //         } else {
            //             // Product does not exist, insert it
            //             sql.query(
            //                 "INSERT INTO orders_details (order_id, product_name, quantity) VALUES (?, ?, ?)",
            //                 [product.order_id, product.product_name, product.quantity],
            //                 (err, insertRes) => {
            //                     if (err) {
            //                         console.error("Error inserting new product:", err);
            //                         result(err, null);
            //                         return;
            //                     }

            //                     result(null, { id: id, ...updatedorders });
            //                 }
            //             );
            //         }
            //     }
            // );
            sql.query(
    "SELECT * FROM orders_details WHERE order_id = ? AND product_name = ?",
    [product.order_id, product.product_name],
    (err, rows) => {
        if (err) {
            console.error("Error checking existing product:", err);
            result(err, null);
            return;
        }

        if (rows.length > 0) {
            // Product exists
            if (product.quantity === 0) {
                // If quantity is 0, delete the product from the order
                sql.query(
                    "DELETE FROM orders_details WHERE order_id = ? AND product_name = ?",
                    [product.order_id, product.product_name],
                    (err, deleteRes) => {
                        if (err) {
                            console.error("Error deleting product:", err);
                            result(err, null);
                            return;
                        }

                        result(null, { message: "Product deleted successfully" });
                    }
                );
            } else {
                // Otherwise update the quantity
                sql.query(
                    "UPDATE orders_details SET quantity = ? WHERE order_id = ? AND product_name = ?",
                    [product.quantity, product.order_id, product.product_name],
                    (err, updateRes) => {
                        if (err) {
                            console.error("Error updating product quantity:", err);
                            result(err, null);
                            return;
                        }

                        result(null, { message: "Product updated successfully" });
                    }
                );
            }
        } else {
            // Product does not exist, only insert if quantity > 0
            if (product.quantity > 0) {
                sql.query(
                    "INSERT INTO orders_details (order_id, product_name, quantity) VALUES (?, ?, ?)",
                    [product.order_id, product.product_name, product.quantity],
                    (err, insertRes) => {
                        if (err) {
                            console.error("Error inserting new product:", err);
                            result(err, null);
                            return;
                        }

                        result(null, { message: "Product inserted successfully" });
                    }
                );
            } else {
                // If trying to insert with 0 qty → just ignore
                result(null, { message: "Quantity is 0, product not added" });
            }
        }
    }
);

        }
    );
};


orders.vacationPause = (id, vacationData, result) => {
    sql.query(
        "UPDATE all_subscription SET ? WHERE user_id = ?",
        [
            vacationData,
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

            console.log("Vacation Paused: ", { id: id, ...vacationData });
            result(null, { id: id, ...vacationData });
        }
    );
};

orders.BagUpdate = (id, updatedorders, result) => {
    sql.query(
        "UPDATE all_subscription SET  gro_bag = ?, mitt_bag = ?, bagu_bag = ?, zusätzliche_tüte = ? WHERE order_id = ?",
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



orders.assignDriverToOrders = (driverId, orderIds, result) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return result({ kind: "invalid_data", message: "Order IDs must be a non-empty array." }, null);
    }

    const placeholders = orderIds.map(() => "?").join(", ");
    const query = `
      UPDATE all_subscription 
      SET driver_id = ?, status = 'Assigned' 
      WHERE id IN (${placeholders})
    `;

    const queryValues = [driverId, ...orderIds];

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
            driverId: driverId,
            orderIds: orderIds,
            updatedRows: res.affectedRows,
        });

        console.log('====================================');
        console.log("hioiiii");
        console.log('====================================');
    });
};


orders.delete = (id, result) => {
    const query = "DELETE FROM all_subscription WHERE id = ?";

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

orders.terminate = (id, order_id, password, terminateData, result) => {

    console.log("----------->", order_id);

    sql.query("SELECT * FROM users WHERE id = ?", [id], async (err, data) => {
        if (err) {
            console.log(`Nothing users within this Id: ${id}`);
            result(err, null);
            return;
        }

        const PasswordIsValid = await bcrypt.compare(password, data[0].password)

        if (PasswordIsValid) {

            // sql.query("UPDATE all_subscription SET ? WHERE order_id = ?", [terminateData, order_id], (err, res) => {
            sql.query("DELETE from all_subscription WHERE user_id = ?", [id], (err, res) => {
                if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                }

                terminateData['order_id'] = order_id;

                // sql.query("INSERT INTO contract SET ?", [terminateData], (err, data) => {
                //     if (err) {
                //         console.log("error: ", err);
                //         result(err, null);
                //         return;
                //     }

                sql.query("DELETE FROM orders_details WHERE order_id = ?", [order_id], (err, res) => {
                    if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                    }

                    sql.query("UPDATE users SET ban_no = ? WHERE id = ?", [null, id], (err, res) => {
                        if (err) {
                            console.log("Updation Failed!!!", err);
                        }
                    });

                });

                console.log("deleted Orders with id: ", id);
                result(null, { id: id });

                // })
            });
        }

    });
};

module.exports = orders;
