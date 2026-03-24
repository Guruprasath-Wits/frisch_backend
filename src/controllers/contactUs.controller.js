const contactUs = require('../services/contactUs.services');



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

    contactUs.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "contactUs not found",
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
                contactUs: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    contactUs.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `contactUs not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving contactUs with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                contactUs: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const contactUs1 = {
        gender: req.body.gender,
        firstname : req.body.firstname,
        lastname : req.body.lastname,
        email : req.body.email,
        phone : req.body.phone,
        description : req.body.description,
        declaration: req.body.declaration
    };

    contactUs.create(contactUs1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the contactUs.",
            });
        } else {
            res.send({
                status: true,
                message: "contactUs created successfully",
                contactUs: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const contactUsId = req.params.id;

    const updatedcontactUs = {
        firstname : req.body.firstname,
        lastname : req.body.lastname,
        email : req.body.email,
        phone : req.body.phone,
        description : req.body.description
    };

    contactUs.edit(contactUsId, updatedcontactUs, (err, data) => {
        if (err) {
            if (err.message === "contactUs not found") {
                return res.status(404).send({
                    message: `contactUs not found with id ${contactUsId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating contactUs with id " + contactUsId,
                    error: err.message || "Some error occurred while updating the contactUs.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "contactUs updated successfully",
                contactUs: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const contactUsId = req.params.id;

    contactUs.delete(contactUsId, (err, data) => {
        if (err) {
            if (err.message === "contactUs not found") {
                return res.status(404).send({
                    message: `contactUs not found with id ${contactUsId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting contactUs with id " + contactUsId,
                    error: err.message || "Some error occurred while deleting the contactUs.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "contactUs deleted successfully",
                contactUs: data,
            });
        }
    });
};