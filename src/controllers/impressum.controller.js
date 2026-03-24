const impressum = require('../services/impressum.services.js');

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
    impressum.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Impressum not found",
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
                impressum: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;

    impressum.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Impressum not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving impressum with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                impressum: data,
            });
        }
    });
};

exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;

    // Rename object to avoid conflicts with the imported `impressum`
    const impressumData = {
        name: req.body.name,
        company_name: req.body.company_name,
        address: req.body.address,
        tel: req.body.tel,
        email: req.body.email,
        business_type: req.body.business_type,
        platform: req.body.platform,
        link: req.body.link,
        notes: req.body.notes,
        privacy_policy: req.body.privacy_policy
    };

    impressum.create(impressumData, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the impressum.",
            });
        } else {
            res.send({
                status: true,
                message: "Impressum created successfully",
                impressum: data,
            });
        }
    });
};

exports.edit = (req, res) => {
    const settingId = req.params.id;

    const updatedSetting = {
        name: req.body.name,
        company_name: req.body.company_name,
        address: req.body.address,
        tel: req.body.tel,
        email: req.body.email,
        business_type: req.body.business_type,
        platform: req.body.platform,
        link: req.body.link,
        notes: req.body.notes,
        privacy_policy: req.body.privacy_policy
    };

    console.log("Updated setting: ", updatedSetting);

    impressum.edit(settingId, updatedSetting, (err, data) => {
        if (err) {
            if (err.message === "impressum not found") {
                return res.status(404).send({
                    message: `Impressum not found with id ${settingId}.`,
                });
            } else {
                return res.status(500).send({
                    message: "Error updating impressum with id " + settingId,
                    error: err.message || "Some error occurred while updating the impressum.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Impressum updated successfully",
                impressum: data,
            });
        }
    });
};


exports.delete = (req, res) => {
    const impressumId = req.params.id;

    impressum.delete(impressumId, (err, data) => {
        if (err) {
            if (err.message === "Impressum not found") {
                return res.status(404).send({
                    message: `Impressum not found with id ${impressumId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting impressum with id " + impressumId,
                    error: err.message || "Some error occurred while deleting the impressum.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Impressum deleted successfully",
                impressum: data,
            });
        }
    });
};
