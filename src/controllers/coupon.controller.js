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

// Helper function to format dates (timezone-safe)
const formatCouponDates = (coupon) => {
    if (coupon.from_date) {
        const fromDate = new Date(coupon.from_date);
        const year = fromDate.getFullYear();
        const month = String(fromDate.getMonth() + 1).padStart(2, '0');
        const day = String(fromDate.getDate()).padStart(2, '0');
        coupon.from_date = `${year}-${month}-${day}`;
    }
    if (coupon.end_date) {
        const endDate = new Date(coupon.end_date);
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        coupon.end_date = `${year}-${month}-${day}`;
    }
    return coupon;
};

exports.renderList = (req, res) => {
    coupon.read((err, data) => {
        if (err && err.kind !== "not_found") {
            return res.status(500).send({
                message: err.message || "Some error occurred while fetching the data.",
            });
        }
        res.render("coupon_list", {
            coupons: data || []
        });
    });
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
            // Format dates for all coupons
            const formattedData = data.map(formatCouponDates);

            res.send({
                status: true,
                message: "Fetched Successfully",
                coupon: formattedData,
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
            // Format dates
            const formattedData = formatCouponDates(data);

            res.send({
                status: true,
                message: "Fetched Successfully",
                coupon: formattedData,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const newCoupon = {
        couponcode: req.body.code || req.body.couponcode,
        type: req.body.type,
        discount_percentage: req.body.discount_percentage || null,
        description: req.body.description,
        user_email: req.body.user_email || null,
        from_date: req.body.from_date,
        end_date: req.body.end_date
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

    const updatedcoupon = {
        couponcode: req.body.code || req.body.couponcode,
        type: req.body.type,
        discount_percentage: req.body.discount_percentage || null,
        description: req.body.description,
        user_email: req.body.user_email || null,
        from_date: req.body.from_date,
        end_date: req.body.end_date
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