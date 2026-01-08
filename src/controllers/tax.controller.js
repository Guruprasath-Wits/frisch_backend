const Tax = require('../services/tax.services');

const validateRequestBody = (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return false;
    }
    return true;
};

exports.read = (req, res) => {
    Tax.read((err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while fetching the data.",
            });
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                tax: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;
    Tax.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Tax not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving tax with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                tax: data,
            });
        }
    });
};

exports.create = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const tax = {
        tax_name: req.body.tax_name,
        tax_value: req.body.tax_value
    };

    Tax.create(tax, (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Some error occurred while creating the Tax.",
            });
        } else {
            res.send({
                status: true,
                message: "Tax created successfully",
                tax: data,
            });
        }
    });
};

exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;
    const id = req.params.id;

    const updatedTax = {
        tax_name: req.body.tax_name,
        tax_value: req.body.tax_value
    };

    Tax.edit(id, updatedTax, (err, data) => {
        if (err) {
            if (err.message === "Tax not found") {
                return res.status(404).send({
                    message: `Tax not found with id ${id}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating tax with id " + id,
                    error: err.message,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Tax updated successfully",
                tax: data,
            });
        }
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    Tax.delete(id, (err, data) => {
        if (err) {
            if (err.message === "Tax not found") {
                return res.status(404).send({
                    message: `Tax not found with id ${id}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting tax with id " + id,
                    error: err.message,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Tax deleted successfully",
                tax: data,
            });
        }
    });
};
