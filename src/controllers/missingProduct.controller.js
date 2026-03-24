const MissingProduct = require('../services/missingProduct.services');

const validateRequestBody = (req, res) => {
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return false;
    }
    return true;
};

exports.markAsRead = (req, res) => {
    MissingProduct.markAsRead(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Missing Product with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error updating Missing Product with id " + req.params.id
                });
            }
        } else res.send(data);
    });
};

exports.create = async (req, res) => {
    // console.log("--------------------------------------------------");
    // console.log("Reiceved Missing Product Request");
    // console.log("Body:", req.body);
    // console.log("--------------------------------------------------");

    if (!validateRequestBody(req, res)) return;

    const missingProductData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        mobile_number: req.body.mobile_number,
        message: req.body.message
    };

    MissingProduct.create(missingProductData, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while reporting the missing product.",
            });
        } else {
            res.send({
                status: true,
                message: "Missing product reported successfully",
                data: data,
            });
        }
    });
};

exports.findAll = (req, res) => {
    MissingProduct.getAll((err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving messages."
            });
        else res.send({ status: true, data: data });
    });
};
