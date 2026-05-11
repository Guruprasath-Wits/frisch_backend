const orders = require('../services/orders.services.js');
const { v4: uuidv4 } = require('uuid');
const { orderConfirmMail } = require("../helpers/mailServices.js");
const { orderDeliveryMail } = require("../helpers/mailServices.js");
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { type } = require('os');

const validateRequestBody = (req, res) => {
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return false;
    }
    return true;
};


exports.create = async (req, res) => {
    console.log("request", req.body)
    try {
        orderType = req.body.type || null; // reference to sending mail for sample order

        let newOrderId;

        if (req.body.order_id) {
            newOrderId = req.body.order_id;
        } else {
            const now = new Date();
            const currentDate = now.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '');

            newOrderId = `ffS_${currentDate}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // ✅ Format date string without timezone conversion
        const formatToYYYYMMDD = (dateStr) => {
            if (!dateStr) return null;

            // Handle ISO strings (e.g., 2026-04-03T18:30:00.000Z)
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }

            // Already in YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }

            // Handle DD-MM-YYYY or DD/MM/YYYY
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                let d, m, y;
                if (parts[0].length === 4) {
                    // YYYY-MM-DD or YYYY/MM/DD
                    [y, m, d] = parts;
                } else {
                    // Assume DD-MM-YYYY or DD/MM/YYYY
                    [d, m, y] = parts;
                }
                return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            }

            return null;
        };

        const orderData = {
            order_id: newOrderId,
            user_id: req.body.user_id,
            delivery_date: req.body.delivery_date
                ? formatToYYYYMMDD(req.body.delivery_date)
                : null,
            address: req.body.address,
            username: req.body.username,
            contact: req.body.contact,
            instruction: req.body.instruction,
            price: req.body.price,
            tips: req.body.tips,
            lat: req.body.lat,
            lng: req.body.lng,
            zipcode: req.body.zipcode,
            ort: req.body.ort,
            status: req.body.status || null,
            deliveryFee: req.body.deliveryFee,
            couponCode: req.body.couponCode || null,
            couponType: req.body.couponType || null,
            discountAmount: req.body.discountAmount || null,
            discountPercentage: req.body.discountPercentage || null,
            is_age_verified: req.body.is_age_verified || 0,
        };

        const productDetails = JSON.parse(JSON.stringify(req.body.productDetails));
        const iban = req.body.iban || null;

        const userData = {
            username: req.body.username,
            email: req.body.email,
            deliveryFee: req.body.deliveryFee
        };

        console.log(userData);
        console.log(orderData);
        console.log("productDetails", productDetails);

        const data = await orders.create(orderData, productDetails);

        console.log("OrderData:", orderData, "productDetails:", productDetails, "userData:", userData);

        if (orderType == 2) {
            const mailResult = await orderConfirmMail(orderData, productDetails, userData);
            if (!mailResult.success) {
                return res.status(500).send({ message: 'Error sending email. Please try again later.' });
            }
        }

        res.send({
            status: true,
            message: "Order created successfully",
            orders: data,
        });

    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the order.",
        });
    }
};


exports.storeProcessedOrders = async (req, res) => {
    const ordersData = req.body.orders;

    // Validate the incoming data
    if (!ordersData || !Array.isArray(ordersData) || ordersData.length === 0) {
        return res.status(400).json({ message: "Invalid or empty orders data" });
    }

    try {
        console.log('Received orders data:', ordersData);

        // Store using the service
        const result = await orders.storeProcessedOrders(ordersData);

        res.status(200).json({
            message: "Processed orders stored successfully",
            insertedCount: result.insertedCount,
            skippedCount: result.skippedCount
        });
    } catch (error) {
        console.error('Error storing processed orders:', error);
        res.status(500).json({
            message: "Failed to store processed orders",
            error: error.message || error
        });
    }
};



exports.subcreate = async (req, res) => {
    try {

        var newOrderId;

        if (req.body.order_id) {
            newOrderId = req.body.order_id;
        }
        else {
            newOrderId = `FfS_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;
        }

        const formatToYYYYMMDD = (dateStr) => {
            if (!dateStr) return null;

            // Handle ISO strings (e.g., 2026-04-03T18:30:00.000Z)
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }

            // Already in YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }

            // Handle DD-MM-YYYY or DD/MM/YYYY
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                let d, m, y;
                if (parts[0].length === 4) {
                    // YYYY-MM-DD or YYYY/MM/DD
                    [y, m, d] = parts;
                } else {
                    // Assume DD-MM-YYYY or DD/MM/YYYY
                    [d, m, y] = parts;
                }
                return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            }

            return null;
        };

        const orderData = {
            order_id: newOrderId,
            user_id: req.body.user_id,
            delivery_date: req.body.delivery_date
                ? formatToYYYYMMDD(req.body.delivery_date)
                : null,
            address: req.body.address,
            contact: req.body.contact,
            instruction: req.body.instruction,
            price: req.body.price,
            tips: req.body.tips,
            is_age_verified: req.body.is_age_verified || 0
        };

        const iban = req.body.iban || null;

        console.log(orderData);

        // const orderDetails = {
        //     order_id: newOrderId,
        //     products_name: req.body.product,
        //     quantity: req.body.quantity,
        // }

        const data = await orders.subcreate(orderData);

        res.send({
            status: true,
            message: "Order created successfully",
            orders: data,
        });
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the order.",
        });
    }
};






exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const ordersId = req.params.id;



    const updatedorders = {
        status: req.body.status,
    };

    // Call the orders.edit method with updated data
    orders.edit(ordersId, updatedorders, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error updating orders with id ${ordersId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "orders updated successfully",
                orders: data,
            });
        }
    });

};

exports.BagUpdate = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const ordersId = req.params.id;



    const updatedorders = {
        gro_bag: req.body.gro_bag,
        mitt_bag: req.body.mitt_bag,
        bagu_bag: req.body.bagu_bag,
        zusätzliche_tüte: req.body.zusätzliche_tüte
    };

    // Call the orders.edit method with updated data
    orders.BagUpdate(ordersId, updatedorders, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error updating orders with id ${ordersId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "orders updated successfully",
                orders: data,
            });
        }
    });

};


exports.assignDriverToOrders = (req, res) => {
    const { driverId, orderIds, indexId } = req.body;

    if (!driverId) {
        return res.status(400).send({
            status: false,
            message: "Driver ID is required and must be a number.",
        });
    }
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).send({
            status: false,
            message: "Order IDs must be a non-empty array.",
        });
    }

    orders.assignDriverToOrders(driverId, orderIds, indexId, (err, data) => {
        if (err) {
            res.status(500).send({
                status: false,
                message: "Error assigning driver to orders.",
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Driver assigned to orders successfully.",
                assignedOrders: data,
            });
        }
    });
};


// exports.assignDriverToOrders = (req, res) => {
//     const { driverId, orderIds } = req.body;

//     // Validate request
//     if (!driverId) {
//         return res.status(400).send({
//             status: false,
//             message: "Driver ID is required and must be a number.",
//         });
//     }
//     if (!Array.isArray(orderIds) || orderIds.length === 0) {
//         return res.status(400).send({
//             status: false,
//             message: "Order IDs must be a non-empty array.",
//         });
//     }

//     orders.assignDriverToOrders(driverId, orderIds, (err, data) => {
//         if (err) {
//             res.status(500).send({
//                 status: false,
//                 message: "Error assigning driver to orders.",
//                 error: err.message,
//             });
//         } else {
//             res.send({
//                 status: true,
//                 message: "Driver assigned to orders successfully.",
//                 assignedOrders: data,
//             });
//             console.log('====================================');
//             console.log(data);
//             console.log('====================================');
//         }
//     });
// };

exports.delete = (req, res) => {
    const ordersId = req.params.id;

    orders.delete(ordersId, (err, data) => {
        if (err) {
            res.status(err.message === "orders not found" ? 404 : 500).send({
                message: `Error deleting orders with id ${ordersId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "orders deleted successfully",
                orders: data,
            });
        }
    });
};

exports.cancel = (req, res) => {

    const orderId = req.params.id;

    orders.cancelOrder(orderId, (err, data) => {
        if (err) {
            res.status(err.message === "orders not found" ? 404 : 500).send({
                message: `Error deleting orders with id ${ordersId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "orders Cancelled successfully",
                orders: data,
            });
        }
    })
}

exports.read = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    orders.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "orders not found",
                });
            } else {
                res.status(500).send({
                    message: err.message || "Some error occurred while fetching the data.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                orders: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    orders.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `orders not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving orders with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                orders: data,
            });
        }
    });
};

exports.OrderDetailsRead = (req, res) => {
    const id = req.params.id;


    orders.OrderDetailsRead(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `orders not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving orders with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                orders: data,
            });
        }
    });
};




//----------------------------------------------------------------------------------

//APP

exports.datefetchAll = (req, res) => {
    const driverId = req.params.id;
    const date = req.query.date; // Use query parameter instead of body

    orders.datefetchAll(driverId, date, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching orders for driver with ID ${driverId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Successfully fetched orders",
                order: data,
            });
        }
    });
};

exports.datefetchComplete = (req, res) => {
    const driverId = req.params.id;
    const date = req.query.date; // Use query parameter instead of body

    orders.datefetchComplete(driverId, date, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching completed orders for driver with ID ${driverId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Successfully fetched completed orders",
                order: data,
            });
        }
    });
};

exports.timedistancefetchComplete = (req, res) => {
    const driverId = req.params.id;
    const date = req.query.date; // Use query parameter instead of body

    orders.timedistancefetchComplete(driverId, date, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching completed orders for driver with ID ${driverId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Successfully fetched completed orders",
                order: data,
            });
        }
    });
};



//warehouseDelete

exports.warehouseDelete = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const driverId = req.params.id;
    const { status } = req.body;

    // Call the orders.orderStatusUpdate method
    orders.warehouseDelete(driverId, status, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error updating order with id`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Order updated successfully",
                order: data,
            });
        }
    });
};


exports.OrderDetailsAllRead = (req, res) => {
    const id = req.params.id;

    orders.OrderDetailsAllRead(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Orders not found`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving orders`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                orders: data,
            });
        }
    });
};



exports.OrderDetailsByDriver = (req, res) => {
    const { driver_id } = req.body;

    if (!driver_id) {
        return res.status(400).send({
            status: false,
            message: "Missing driver_id in request body"
        });
    }

    orders.readByDriver(driver_id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `No orders found for driver_id ${driver_id}`
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving orders for driver_id ${driver_id}`
                });
            }
        } else {
            res.send({
                status: true,
                message: "Orders fetched successfully",
                orders: data
            });
        }
    });
};






exports.orderStatusUpdate = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const ordersId = req.params.id;
    const status = req.body.status;

    // Call the orders.orderStatusUpdate method
    orders.orderStatusUpdate(ordersId, status, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error updating order with id ${ordersId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Order updated successfully",
                order: data,
            });
        }
    });
};

exports.DeliveryComplete = async (req, res) => {
    try {
        const { imageData, picture, user_id, order_id } = req.body;

        // ✅ Save picture if provided
        if (imageData && imageData !== "No Picture Available" && picture && picture !== "No Picture Available") {
            // Point to the same uploads folder as in index.js
            const uploadDir = path.join(__dirname, 'uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const imageBuffer = Buffer.from(imageData, 'base64');
            const uploadPath = path.join(uploadDir, picture);
            fs.writeFileSync(uploadPath, imageBuffer);
        }

        // const backendUrl = "http://localhost:4001";
        const backendUrl = "https://api.frischfuersie.de";

        const comDetail = {
            delivery_person_id: req.body.delivery_person_id,
            order_id: order_id,
            user_id: user_id,
            complete_time: req.body.complete_time,
            complete_distance: req.body.complete_distance,
            picture: picture ? `${backendUrl}/uploads/${picture}` : null,
            date: req.body.date,
            time: req.body.time,
            status: req.body.status,
        };

        const data = await orders.DeliveryComplete(comDetail);
        const user = await orders.getUserById(user_id);

        if (!user || !user.email) {
            return res.status(400).send({
                status: false,
                message: 'User email not found. Cannot send delivery email.',
            });
        }

        const orderData = { orderId: order_id };
        const userData = { email: user.email, username: user.name || 'Kunde' };

        const mailResult = await orderDeliveryMail(orderData, userData);

        if (!mailResult.success) {
            return res.status(500).send({
                status: false,
                message: 'Order saved, but email sending failed.',
            });
        }

        return res.send({
            status: true,
            message: 'Order completed successfully and email sent',
            orders: data,
        });
    } catch (err) {
        console.error('Error in /deliveryComplete:', err);
        return res.status(500).send({
            status: false,
            message: err.message || 'Some error occurred while completing the delivery.',
        });
    }
};


// exports.DeliveryComplete = async (req, res) => {
//   try {
//     const { imageData, picture, user_id, order_id } = req.body;

//     // ✅ Save picture if provided
//     if (imageData && imageData !== "No Picture Available" && picture && picture !== "No Picture Available") {
//       const uploadDir = path.join(__dirname, 'controllers/uploads');

//       if (!fs.existsSync(uploadDir)) {
//         fs.mkdirSync(uploadDir, { recursive: true });
//       }

//       const imageBuffer = Buffer.from(imageData, 'base64');
//       const uploadPath = path.join(uploadDir, picture);
//       fs.writeFileSync(uploadPath, imageBuffer);
//     }

//     // const backendUrl = "https://api.frischfuersie.de";

//     const backendUrl = "https://localhost:4001";

//     const comDetail = {
//       delivery_person_id: req.body.delivery_person_id,
//       order_id: order_id,
//       user_id: user_id,
//       complete_time: req.body.complete_time,
//       complete_distance: req.body.complete_distance,
//       picture: picture ? `${backendUrl}/uploads/${picture}` : null,
//       date: req.body.date,
//       time: req.body.time,
//       status: req.body.status,
//     };

//     // ✅ Save order delivery complete details to DB
//     const data = await orders.DeliveryComplete(comDetail);

//     // ✅ Fetch user details from DB
//     const user = await orders.getUserById(user_id);
//     console.log("Fetched user for email:", user);

//     if (!user || !user.email) {
//       console.error("No email found for user:", user_id, user);
//       return res.status(400).send({
//         status: false,
//         message: 'User email not found. Cannot send delivery email.',
//       });
//     }

//     // ✅ Prepare data for mail
//     const orderData = { orderId: order_id };
//     const userData = { email: user.email, username: user.name || 'Kunde' };

//     // ✅ Send delivery complete mail
//     const mailResult = await orderDeliveryMail(orderData, userData);

//     if (!mailResult.success) {
//       console.error("Email sending failed:", mailResult.message);
//       return res.status(500).send({
//         status: false,
//         message: 'Order saved, but email sending failed.',
//       });
//     }

//     // ✅ Final response
//     return res.send({
//       status: true,
//       message: 'Order completed successfully and email sent',
//       orders: data,
//     });

//   } catch (err) {
//     console.error('Error in /deliveryComplete:', err);
//     return res.status(500).send({
//       status: false,
//       message: err.message || 'Some error occurred while completing the delivery.',
//     });
//   }
// };

//deliverycompleteAll

exports.deliverycompleteAll = (req, res) => {
    // const deli_orders = {
    //     id: req.query.id,
    //     status: req.query.status,
    // };

    // const driverId = req.params.id;

    orders.deliverycompleteAll((err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching orders.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Orders fetched successfully",
                orders: data,
            });
        }
    });
};


exports.driverhistory = (req, res) => {
    // const deli_orders = {
    //     id: req.query.id,
    //     status: req.query.status,
    // };

    const driverId = req.params.id;

    orders.driverhistory(driverId, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching orders with id ${driverId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Orders fetched successfully",
                orders: data,
            });
        }
    });
};

exports.driverperformanceRead = (req, res) => {
    // const deli_orders = {
    //     id: req.query.id,
    //     status: req.query.status,
    // };

    // const driverId = req.params.id;

    orders.driverperformanceRead((err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching order.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Orders fetched successfully",
                orders: data,
            });
        }
    });
};

//driverperformanceRead

exports.driverperformance = async (req, res) => {
    try {
        const orderData = {
            driver_id: req.body.driver_id,
            driverName: req.body.driverName,
            delivery_date: req.body.delivery_date,
            delivery_time: req.body.delivery_time,
            delivery_distance: req.body.delivery_distance,
            total_delivery: req.body.total_delivery,
        };

        console.log("Received order data:", orderData);

        const data = await orders.insertOrUpdateDriverPerformance(orderData);


        res.status(200).send({
            status: true,
            message: "Driver performance record created successfully.",
            orders: data,
        });
    } catch (err) {
        console.error("Error occurred:", err.message);
        res.status(500).send({
            status: false,
            message: err.message || "Some error occurred while processing the request.",
        });
    }
};


exports.driverAll = (req, res) => {
    const deli_orders = {
        // id: req.query.id,
        date: req.query.date,
    };

    const driverId = req.params.id;

    orders.driverAll(driverId, deli_orders, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching orders with id ${driverId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Orders fetched successfully",
                orders: data,
            });
        }
    });
};


exports.totaltimeanddistance = (req, res) => {
    const deli_orders = {
        date: req.query.date,
    };

    const driverId = req.params.id;

    orders.totaltimeanddistance(driverId, deli_orders, async (err, data) => {
        if (err) {
            return res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching orders with id ${driverId}.`,
                error: err.message || err,
            });
        }

        res.send({
            status: true,
            message: "Tot Orders fetched successfully",
            orders: data.orders,
            estimatedTimeInMinutes: data.estimatedTimeInMinutes,
            distanceDiffKm: data.distanceDiffKm,
        });
    });
};





exports.orderdeli = async (req, res) => {
    const deli_orders = {
        id: req.query.id,
        status: req.query.status,
    };


    // //
    // const apiKey = "AIzaSyC3W5rxhAe_8jiR9NjhbFSq6yU0b4N1WQI";
    // // const apiKey = "AIzaSyA0NyTgV-wZjK3ixL-ZTci74WYmR2VXfhg"; // Replace with your actual Google Maps API key
    // const origin = "Bäckerei Vorwerk, Höfkerstraße 38, 44149 Dortmund"; // Starting point coordinates

    orders.orderdeli(deli_orders, async (err, locations) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error fetching orders with id ${deli_orders.id}.`,
                error: err.message,
            });
            return;
        }



        // try {
        //     // Step 1: Sort locations by proximity to form a single route
        //     const sortedLocations = [];
        //     let currentPoint = origin;
        //     let remainingLocations = [...locations];

        //     while (remainingLocations.length) {
        //         const closestLocation = await findClosestLocation(currentPoint, remainingLocations, apiKey);
        //         sortedLocations.push({
        //             ...closestLocation.location,
        //             distance: closestLocation.distanceInKm, // Distance from the previous point
        //             duration: closestLocation.durationInMinutes, // Duration from the previous point
        //         });
        //         currentPoint = `${closestLocation.location.lat},${closestLocation.location.lng}`;
        //         remainingLocations = remainingLocations.filter((loc) => loc.id !== closestLocation.location.id);
        //     }

        //     // Step 2: Respond with the sorted locations
        //     res.send({
        //         status: true,
        //         message: "Orders fetched, sorted, and distances calculated successfully",
        //         sortedLocations, // Includes distance and duration for each point
        //     });

        //     console.log("Sorted Locations:", sortedLocations);
        // } catch (error) {
        //     console.error("Error processing distances and durations:", error.message);
        //     res.status(500).send({
        //         status: false,
        //         message: "Failed to process locations",
        //         error: error.message,
        //     });
        // }
    });
};



// Helper function to find the closest location and calculate distance/duration
async function findClosestLocation(origin, locations, apiKey) {
    const closest = { location: null, distanceInKm: "Infinity", durationInMinutes: "Infinity" };

    await Promise.all(
        locations.map(async (location) => {
            const destination = `${location.address}`;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
            //console.log(url);
            try {
                const response = await axios.get(url);
                const element = response.data.rows[0].elements[0];
                const distanceInKm = element.distance ? (element.distance.value / 1000).toFixed(2) : "Infinity";
                const durationInMinutes = element.duration ? Math.ceil(element.duration.value / 60) : "Infinity";

                if (parseFloat(distanceInKm) < parseFloat(closest.distanceInKm)) {
                    closest.location = location;
                    closest.distanceInKm = parseFloat(distanceInKm);
                    closest.durationInMinutes = parseInt(durationInMinutes);
                }
            } catch (error) {
                console.error(`Error finding closest location for ${location.id}:`, error.message);
            }
        })
    );

    return closest;
}


//--------------------------------------------------------------------------------------------------------------------------


