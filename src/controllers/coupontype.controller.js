const coupontype = require('../services/coupontype.services');



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

    coupontype.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "coupontype not found",
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
                coupontype: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    coupontype.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `coupontype not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving coupontype with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                coupontype: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const newCouponType = {
        type: req.body.type,
        description: req.body.description,

    };



    coupontype.create(newCouponType, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the coupontype.",
            });
        } else {
            res.send({
                status: true,
                message: "coupontype created successfully",
                coupontype: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const coupontypeId = req.params.id;

    const updatedcoupontype = {
        type: req.body.type,
        description: req.body.description,
    };

    coupontype.edit(coupontypeId, updatedcoupontype, (err, data) => {
        if (err) {
            if (err.message === "coupontype not found") {
                return res.status(404).send({
                    message: `coupontype not found with id ${coupontypeId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating coupontype with id " + coupontypeId,
                    error: err.message || "Some error occurred while updating the coupontype.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "coupontype updated successfully",
                coupontype: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const coupontypeId = req.params.id;

    coupontype.delete(coupontypeId, (err, data) => {
        if (err) {
            if (err.message === "coupontype not found") {
                return res.status(404).send({
                    message: `coupontype not found with id ${coupontypeId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting coupontype with id " + coupontypeId,
                    error: err.message || "Some error occurred while deleting the coupontype.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "coupontype deleted successfully",
                coupontype: data,
            });
        }
    });
};