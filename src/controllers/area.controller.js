const area = require('../services/area.services');



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

    area.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "area not found",
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
                area: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    area.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `area not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving area with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                area: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const area1 = {
        area_name: req.body.area_name,
        zipcode: req.body.zipcode,

    };



    area.create(area1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the area.",
            });
        } else {
            res.send({
                status: true,
                message: "area created successfully",
                area: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const areaId = req.params.id;

    const updatedarea = {
        area_name: req.body.area_name,
        zipcode: req.body.zipcode,
    };

    area.edit(areaId, updatedarea, (err, data) => {
        if (err) {
            if (err.message === "area not found") {
                return res.status(404).send({
                    message: `area not found with id ${areaId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating area with id " + areaId,
                    error: err.message || "Some error occurred while updating the area.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "area updated successfully",
                area: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const areaId = req.params.id;

    area.delete(areaId, (err, data) => {
        if (err) {
            if (err.message === "area not found") {
                return res.status(404).send({
                    message: `area not found with id ${areaId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting area with id " + areaId,
                    error: err.message || "Some error occurred while deleting the area.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "area deleted successfully",
                area: data,
            });
        }
    });
};