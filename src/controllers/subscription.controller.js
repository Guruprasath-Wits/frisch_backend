const orders = require('../services/subscription.services.js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { subscribe } = require('../routes/admin.route.js');
const { orderDeleteMail } = require("../helpers/mailServices.js");


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
    try {
        const currentDateIST = new Date().toLocaleDateString('en-GB', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '');

        const newOrderId = `FfSs_${currentDateIST}_${Math.floor(1000 + Math.random() * 9000)}`;

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
            address: req.body.address,
            contact: req.body.contact,
            instruction: req.body.instruction,
            price: req.body.price,
            tips: req.body.tips,
            delivery_date: req.body.delivery_date
                ? formatToYYYYMMDD(req.body.delivery_date)
                : null,
            // declaration: req.body.declaration
        };

        const iban = req.body.iban || null;
        const productDetails = req.body.productDetails;

        const userData = {
            username: req.body.username,
            email: req.body.email,
            deliveryFee: req.body.deliveryFee
        }



        console.log("dats", req.body);
        console.log("data", userData)

        const data = await orders.create(orderData, productDetails, iban);

        res.send({
            status: true,
            message: "subscription Order created successfully",
            subscribeData: data,
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
        status: req.body.status
    };

    // Call the orders.edit method with updated data
    orders.edit(ordersId, updatedorders, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error updating subscription orders with id ${ordersId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "subscription orders updated successfully",
                subscribeData: data,
            });
        }
    });

};



exports.updateSubscribe = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const ordersId = req.params.order_id;

    const updatedorders = {
        price: req.body.price,

    };

    const product = {
        order_id: ordersId,
        product_name: req.body.product_name,
        quantity: req.body.quantity
    }

    // console.log(ordersId,updatedorders,product);


    // Call the orders.edit method with updated data
    orders.updateSubscribe(ordersId, updatedorders, product, (err, data) => {
        if (err) {
            res.status(err.kind === "not_found" ? 404 : 500).send({
                message: `Error updating subscription orders with id ${ordersId}.`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "subscription orders updated successfully",
                subscribeData: data,
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
    const { driverId, orderIds } = req.body;

    // Validate request
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

    orders.assignDriverToOrders(driverId, orderIds, (err, data) => {
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
            console.log('====================================');
            console.log(data);
            console.log('====================================');
        }
    });
};




exports.delete = (req, res) => {
    const ordersId = req.params.id;



    orders.delete(ordersId, (err, data) => {
        if (err) {
            res.status(err.message === "orders not found" ? 404 : 500).send({
                message: `Error deleting subscription orders with id ${ordersId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "subscription orders deleted successfully",
                subscribeData: data,
            });
        }
    });
};

exports.terminate = async (req, res) => {
    const user_id = req.params.id;

    const terminateData = {
        user_id: user_id,
        termination_date: req.body.termination_date,
        reason: req.body.reason
    };

    const password = req.body.password;

    orders.findById(user_id, (err, data) => {
        if (err) {
            return res.status(err.message === "Subscription orders not found" ? 404 : 500).send({
                message: `Error fetching subscription orders with id`,
                error: err.message,
            });
        }

        if (data) {
            console.log("Fetched subscription data:", data);

            const order_id = data[0]?.order_id ?? null;

            // Call the terminate function
            orders.terminate(user_id, order_id, password, terminateData, async (err, userData) => {
                if (err) {
                    return res.status(500).send({
                        message: `Error terminating the subscription`,
                        error: err,
                    });
                } else {
                    try {
                        // Send email with the user data returned from terminate service
                        const mailResult = await orderDeleteMail(userData);
                        console.log(mailResult);

                        if (!mailResult.success) {
                            return res.status(500).send({ message: 'Error sending email. Please try again later.' });
                        }

                        res.send({
                            status: true,
                            message: "Orders deleted successfully",
                            subscribeData: data,
                        });
                    } catch (mailErr) {
                        console.error(mailErr);
                        return res.status(500).send({ message: 'Unexpected error sending email.' });
                    }
                }
            });
        } else {
            return res.status(404).send({ message: 'No subscription data found.' });
        }
    });
};




exports.vacationPause = (req, res) => {
    const user_id = req.params.id;

    const vacationData = {
        vacation_start: req.body.vacation_start,
        vacation_end: req.body.vacation_end
    }

    orders.vacationPause(user_id, vacationData, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `subscription not found with id ${user_id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Vacation Paused !!!",
                subscribeData: data,
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
                subscribeData: data,
            });
        }
    });
};



exports.Deliveryread = (req, res) => {
    const id = req.params.id;

    orders.Deliveryread(id, (err, data) => {
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
                subscribeData: data,
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
                subscribeData: data,
            });
        }
    });
};

exports.readByOrderId = (req, res) => {
    const id = req.params.order_id;

    orders.findByOrderId(id, (err, data) => {
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
                subscribeData: data[0],
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
                subscribeData: data,
            });
        }
    });
};
