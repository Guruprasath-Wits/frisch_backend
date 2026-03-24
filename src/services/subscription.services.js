const sql = require("../helpers/db.js");
const bcrypt = require('bcryptjs');

const orders = {};

orders.read = (callback) => {
    sql.query("SELECT * FROM subscription", (err, results) => {
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

orders.Deliveryread = (id, result) => {
    const query = "SELECT * FROM subscription WHERE subscription_id = ?";
    
    sql.query(query, [id], (err, res) => {
        if (err) {
            console.error("SQL error: ", err);
            result(err, null);
            return;
        }

        if (res.length > 0) {
            console.log("Order found: ", res[0]);
            result(null, res);
        } else {
            console.warn("Order not found with subscription_id:", id);
            result({ kind: "not_found" }, null);
        }
    });
};


orders.findById = (id, result) => {
    sql.query(`SELECT * FROM subscription WHERE user_id = ?`, [id], (err, res) => {
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
    sql.query(`SELECT * FROM subscription WHERE order_id = ?`, [id], (err, res) => {
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

        sql.query("UPDATE users SET ban_no = ? WHERE id = ?", [iban, orderData.user_id], (err, res) => {
            if (err) {
                console.log("Updation Failed!!!", err);
            }
        })

        // Step 1: Insert main order
        sql.query("INSERT INTO subscription SET ?", orderData, (err, res) => {
            if (err) {
                console.log("Error inserting order:", err);
                reject(err);
                return;
            }
            console.log("--------------------------------------------------------------------")
            console.log("Order inserted:", { id: res.insertId, ...orderData });
            console.log("--------------------------------------------------------------------")

            // Step 2: Insert product details
            const orderId = orderData.order_id;
            const promises = productDetails.map(([product_name, quantity]) => {
                console.log("==================================================================")
                console.log(productDetails)
                console.log("==================================================================")
                return new Promise((resolveProduct, rejectProduct) => {
                    sql.query(
                        "INSERT INTO orders_details SET order_id = ?, product_name = ?, quantity = ?",
                        [orderId, product_name, quantity],
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
                                });
                                resolveProduct({
                                    id: res.insertId,
                                    order_id: orderId,
                                    product_name,
                                    quantity,
                                });
                            }
                        }
                    );
                });
            });

            // Wait for all product insertions to complete
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
    });
}


orders.edit = (id, updatedorders, result) => {
    sql.query(
        "UPDATE subscription SET  status = ? WHERE id = ?",
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

orders.updateSubscribe = (id, updatedorders, product, result) => {
  sql.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting DB connection:", err);
      result(err, null);
      return;
    }

    connection.beginTransaction((err) => {
      if (err) {
        console.error("Transaction Error:", err);
        connection.release();
        result(err, null);
        return;
      }

      connection.query(
        "UPDATE all_subscription SET price = ? WHERE order_id = ?",
        [updatedorders.price, id],
        (err, res) => {
          if (err) {
            console.error("Error updating subscription:", err);
            return connection.rollback(() => {
              connection.release();
              result(err, null);
            });
          }

          if (res.affectedRows == 0) {
            return connection.rollback(() => {
              connection.release();
              result({ kind: "not_found" }, null);
            });
          }

      // First, check if the product already exists for that order
connection.query(
  "SELECT quantity FROM orders_details WHERE order_id = ? AND product_name = ?",
  [product.order_id, product.product_name],
  (err, rows) => {
    if (err) {
      console.error("Error checking existing product:", err);
      return connection.rollback(() => {
        connection.release();
        result(err, null);
      });
    }

    if (rows.length > 0) {
      // Product exists - update the quantity
      const newQuantity =  product.quantity;
      connection.query(
        "UPDATE orders_details SET quantity = ? WHERE order_id = ? AND product_name = ?",
        [newQuantity, product.order_id, product.product_name],
        (err, res2) => {
          if (err) {
            console.error("Error updating existing product quantity:", err);
            return connection.rollback(() => {
              connection.release();
              result(err, null);
            });
          }

          connection.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              return connection.rollback(() => {
                connection.release();
                result(err, null);
              });
            }

            connection.release();
            console.log("Product quantity updated successfully.");
            result(null, { id: id, ...updatedorders });
          });
        }
      );
    } else {
      // Product does not exist - insert new
      connection.query(
        "INSERT INTO orders_details SET order_id = ?, product_name = ?, quantity = ?",
        [product.order_id, product.product_name, product.quantity],
        (err, res2) => {
          if (err) {
            console.error("Error inserting order detail:", err);
            return connection.rollback(() => {
              connection.release();
              result(err, null);
            });
          }

          connection.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              return connection.rollback(() => {
                connection.release();
                result(err, null);
              });
            }

            connection.release();
            console.log("Order detail inserted successfully:", {
              id: res2.insertId,
              ...product,
            });
            result(null, { id: id, ...updatedorders });
          });
        }
      );
    }
  }
);

        }
      );
    });
  });
};


orders.vacationPause = (id, vacationData, result) => {
    sql.query(
        "UPDATE subscription SET ? WHERE user_id = ?",
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
        "UPDATE subscription SET  gro_bag = ?, mitt_bag = ?, bagu_bag = ?, zusätzliche_tüte = ? WHERE order_id = ?",
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
      UPDATE subscription 
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
    const query = "DELETE FROM subscription WHERE id = ?";

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

        const PasswordIsValid = await bcrypt.compare(password, data[0].password);

        if (PasswordIsValid) {
            sql.query("DELETE from subscription WHERE user_id = ?", [id], (err, res) => {
                if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                }

                terminateData['order_id'] = order_id;

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

                // Create user data object to return
                const userInfo = {
                    id: id,
                    username: data[0]?.username || 'Kunde',
                    email: data[0]?.email,
                    deliveryFee: data[0]?.deliveryFee
                };

                console.log("deleted Orders with id: ", userInfo);
                // Return the user info back to the controller
                result(null, userInfo);
            });
        } else {
            result("Invalid password", null);  // Handle invalid password case
        }
    });
};


module.exports = orders;
