const MainCategory = require('../services/main_category.services');

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
    MainCategory.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Main Category not found",
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
                category: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;

    MainCategory.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Main Category not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving main category with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                category: data,
            });
        }
    });
};

exports.create = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const category = {
        category_name: req.body.category_name,
        category_desc: req.body.category_desc,
    };

    MainCategory.create(category, (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Some error occurred while creating the Main Category.",
            });
        } else {
            res.send({
                status: true,
                message: "Main Category created successfully",
                category: data,
            });
        }
    });
};

exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const categoryId = req.params.id;

    const updatedCategory = {
        category_name: req.body.category_name,
        category_desc: req.body.category_desc,
    };

    MainCategory.edit(categoryId, updatedCategory, (err, data) => {
        if (err) {
            if (err.message === "Main Category not found") {
                return res.status(404).send({
                    message: `Main Category not found with id ${categoryId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating main category with id " + categoryId,
                    error: err.message || "Some error occurred while updating the Main Category.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Main Category updated successfully",
                category: data,
            });
        }
    });
};

exports.delete = (req, res) => {
    const categoryId = req.params.id;

    MainCategory.delete(categoryId, (err, data) => {
        if (err) {
            if (err.message === "Main Category not found") {
                return res.status(404).send({
                    message: `Main Category not found with id ${categoryId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting main category with id " + categoryId,
                    error: err.message || "Some error occurred while deleting the Main Category.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Main Category deleted successfully",
                category: data,
            });
        }
    });
};
