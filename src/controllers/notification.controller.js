const Nodification = require('../services/notification.services');



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

    Nodification.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Nodification not found",
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
                nodification: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    Nodification.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Nodification not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving Notification with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                nodification: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const nodification = {
        title: req.body.title,
        desc: req.body.desc,
        reason: req.body.reason,
        status:req.body.status

    };



    Nodification.create(nodification, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Notification.",
            });
        } else {
            res.send({
                status: true,
                message: "Notification created successfully",
                notification: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const notificationId = req.params.id;

    const updatedNotification = {
        status: req.body.status,
    };

    Nodification.edit(notificationId, updatedNotification, (err, data) => {
        if (err) {
            if (err.message === "Notification not found") {
                return res.status(404).send({
                    message: `Notification not found with id ${notificationId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating Notification with id " + notificationId,
                    error: err.message || "Some error occurred while updating the Notification.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Notification updated successfully",
                notification: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const nodificationId = req.params.id;

    Nodification.delete(nodificationId, (err, data) => {
        if (err) {
            if (err.message === "Notification not found") {
                return res.status(404).send({
                    message: `Notification not found with id ${nodificationId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting Notification with id " + nodificationId,
                    error: err.message || "Some error occurred while deleting the Notification.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Notification deleted successfully",
                notification: data,
            });
        }
    });
};