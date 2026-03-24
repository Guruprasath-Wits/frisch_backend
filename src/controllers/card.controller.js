const card = require('../services/card.services');



const validateRequestBody = (req, res) => {
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return false;
    }
    return true;
};

exports.read = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    card.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "card not found",
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
                card: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    card.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `card not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving card with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                card: data,
            });
        }
    });
};

exports.readByUserId = (req, res) => {
    const user_id = req.params.user_id;
    card.findByUserId(user_id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `card not found with id ${user_id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving card with id ${user_id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                card: data,
            });
        }
    });
};

exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const card1 = {
        user_id: req.body.user_id,
        product_id: req.body.product_id,
        quantity: req.body.quantity,
        is_combo: req.body.is_combo
    };



    card.create(card1, (err, data) => {
        if (err) {
            if (err.message === "Product already exists in the cart.") {
                res.status(400).send({
                    status: false,
                    message: err.message,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: err.message || "Some error occurred while creating the card.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Card created successfully",
                card: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    // const cardId = req.params.id;

    const updatedcard = {
        cart_id: req.body.cart_id,
        quantity: req.body.quantity,
    };

    card.edit(updatedcard, (err, data) => {
        if (err) {
            if (err.message === "card not found") {
                return res.status(404).send({
                    message: `card not found with id ${updatedcard.cart_id}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating card with id " + updatedcard.cart_id,
                    error: err.message || "Some error occurred while updating the card.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "card updated successfully",
                card: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const cardId = req.params.id;

    card.delete(cardId, (err, data) => {
        if (err) {
            if (err.message === "card not found") {
                return res.status(404).send({
                    message: `card not found with id ${cardId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting card with id " + cardId,
                    error: err.message || "Some error occurred while deleting the card.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "cart deleted successfully",
                card: data,
            });
        }
    });
};

exports.deleteUserProduct = (req, res) => {
    const cardId = req.params.userId;

    card.deleteUserProduct(cardId, (err, data) => {
        if (err) {
            if (err.message === "card not found") {
                return res.status(404).send({
                    message: `card not found with id ${cardId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting card with id " + cardId,
                    error: err.message || "Some error occurred while deleting the card.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "cart deleted successfully",
                card: data,
            });
        }
    });
};