const address = require('../services/address.services.js');


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

    address.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Address not found",
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
                address: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    address.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Address not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving address with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                address: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const address1 = {
        houseNo: req.body.houseNo,
        address: req.body.address,
        city: req.body.city,
        landmark: req.body.landmark,
        addressType: req.body.addressType

    };



    address.create(address1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the address.",
            });
        } else {
            res.send({
                status: true,
                message: "Address created successfully",
                address: data,
            });
        }
    });
};


exports.creates = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const address1 = {
        response: req.body.response,
        orderId: req.body.orderId,
        userId: req.body.userId,
        

    };
    address.creates(address1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the orders.",
            });
        } else {
            res.send({
                status: true,
                message: "Order created successfully",
                address: data,
            });
        }
    });
};






exports.delete = (req, res) => {
    const addressId = req.params.id;

    address.delete(addressId, (err, data) => {
        if (err) {
            if (err.message === "Address not found") {
                return res.status(404).send({
                    message: `Address not found with id ${addressIdId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting address with id " + addressId,
                    error: err.message || "Some error occurred while deleting the address.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Address deleted successfully",
                address: data,
            });
        }
    });
};


