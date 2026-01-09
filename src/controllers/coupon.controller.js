const coupon = require('../services/coupon.services');

const COUPON_TYPES = ['PERCENTAGE', 'FIXED'];
const COUPON_STATUSES = ['ACTIVE', 'INACTIVE', 'EXPIRED'];




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

    coupon.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "coupon not found",
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
                coupon: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    coupon.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `coupon not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving coupon with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                coupon: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const { type, status } = req.body;

    if (type && !COUPON_TYPES.includes(type.toUpperCase())) {
        return res.status(400).send({
            message: `Invalid coupon type. Allowed values: ${COUPON_TYPES.join(', ')}`
        });
    }

    if (status && !COUPON_STATUSES.includes(status.toUpperCase())) {
        return res.status(400).send({
            message: `Invalid coupon status. Allowed values: ${COUPON_STATUSES.join(', ')}`
        });
    }


    const newCoupon = {
        type: req.body.type,
        subtype: req.body.subtype,
        description: req.body.description,
        couponcode: req.body.couponcode,
        user: req.body.user,
        status: req.body.status

    };



    coupon.create(newCoupon, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the coupon.",
            });
        } else {
            res.send({
                status: true,
                message: "coupon created successfully",
                coupon: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const couponId = req.params.id;
    const { type, status } = req.body;

    if (type && !COUPON_TYPES.includes(type.toUpperCase())) {
        return res.status(400).send({
            message: `Invalid coupon type. Allowed values: ${COUPON_TYPES.join(', ')}`
        });
    }

    if (status && !COUPON_STATUSES.includes(status.toUpperCase())) {
        return res.status(400).send({
            message: `Invalid coupon status. Allowed values: ${COUPON_STATUSES.join(', ')}`
        });
    }

    const updatedcoupon = {
        type: req.body.type,
        subtype: req.body.subtype,
        description: req.body.description,
        couponcode: req.body.couponcode,
        user: req.body.user,
        status: req.body.status
    };

    coupon.edit(couponId, updatedcoupon, (err, data) => {
        if (err) {
            if (err.message === "coupon not found") {
                return res.status(404).send({
                    message: `coupon not found with id ${couponId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating coupon with id " + couponId,
                    error: err.message || "Some error occurred while updating the coupon.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "coupon updated successfully",
                coupon: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const couponId = req.params.id;

    coupon.delete(couponId, (err, data) => {
        if (err) {
            if (err.message === "coupon not found") {
                return res.status(404).send({
                    message: `coupon not found with id ${couponId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting coupon with id " + couponId,
                    error: err.message || "Some error occurred while deleting the coupon.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "coupon deleted successfully",
                coupon: data,
            });
        }
    });
};