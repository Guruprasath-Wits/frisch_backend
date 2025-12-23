const role = require('../services/role.services');



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

    role.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "role not found",
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
                role: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    role.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `role not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving role with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                role: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const role1 = {
        role_name: req.body.role_name,
    };

    role.create(role1, (err, data) => {
        if (err) {
            return res.status(500).send({
                status: false,
                message: err.message || "Some error occurred while creating the role.",
            });
        } else {
            res.send({
                status: true,
                message: "Role created successfully",
                role: data,
            });
        }
    });
};

exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const roleId = req.params.id;

    const updatedrole = {
        role_name: req.body.role_name,
    };

    role.edit(roleId, updatedrole, (err, data) => {
        if (err) {
            if (err.message === "role not found") {
                return res.status(404).send({
                    status: false,
                    message: `Role not found with id ${roleId}.`
                });
            } else if (err.message === "role already exists") {
                return res.status(400).send({
                    status: false,
                    message: "Role name already exists. Please choose another name."
                });
            } else {
                return res.status(500).send({
                    status: false,
                    message: "Error updating role with id " + roleId,
                    error: err.message,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Role updated successfully",
                role: data,
            });
        }
    });
};




exports.delete = (req, res) => {
    const roleId = req.params.id;

    role.delete(roleId, (err, data) => {
        if (err) {
            if (err.message === "role not found") {
                return res.status(404).send({
                    message: `role not found with id ${roleId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting role with id " + roleId,
                    error: err.message || "Some error occurred while deleting the role.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "role deleted successfully",
                role: data,
            });
        }
    });
};