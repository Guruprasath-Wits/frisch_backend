const userAdv = require('../services/userAdv.services');



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

    userAdv.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "userAdv not found",
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
                userAdv: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    userAdv.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `userAdv not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving userAdv with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                userAdv: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const userAdv1 = {
        adv_qns: req.body.adv_qns,
        adv_ans: req.body.adv_ans,

    };



    userAdv.create(userAdv1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the userAdv.",
            });
        } else {
            res.send({
                status: true,
                message: "userAdv created successfully",
                userAdv: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const userAdvId = req.params.id;

    const updateduserAdv = {
        adv_qns: req.body.adv_qns,
        adv_ans: req.body.adv_ans,
    };

    userAdv.edit(userAdvId, updateduserAdv, (err, data) => {
        if (err) {
            if (err.message === "userAdv not found") {
                return res.status(404).send({
                    message: `userAdv not found with id ${userAdvId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating userAdv with id " + userAdvId,
                    error: err.message || "Some error occurred while updating the userAdv.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "userAdv updated successfully",
                userAdv: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const userAdvId = req.params.id;

    userAdv.delete(userAdvId, (err, data) => {
        if (err) {
            if (err.message === "userAdv not found") {
                return res.status(404).send({
                    message: `userAdv not found with id ${userAdvId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting userAdv with id " + userAdvId,
                    error: err.message || "Some error occurred while deleting the userAdv.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "userAdv deleted successfully",
                userAdv: data,
            });
        }
    });
};

