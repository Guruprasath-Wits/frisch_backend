const Category = require('../services/category.services');
const multer = require('multer');
const fs = require('fs');
const path = require('path');



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

    Category.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Category not found",
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


    Category.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Category not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving category with id ${id}`,
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



const uploadDir = path.join(__dirname, '..', 'uploads/category');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});


const upload1 = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    },
});


exports.create = (req, res) => {
    upload1.single('category_img')(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(500).send({
                message: "Error uploading the file.",
                error: err.message
            });
        }

        if (!validateRequestBody(req, res)) return;

        const category = {
            category_name: req.body.category_name,
            category_type: req.body.category_type,

            category_desc: req.body.category_desc,
            category_img: req.file ? `/uploads/category/${req.file.filename}` : null,
            delivery_fee_weekday: req.body.delivery_fee_weekday || 0,
            delivery_fee_weekend: req.body.delivery_fee_weekend || 0,
            holiday_fee: req.body.holiday_fee || 0,
        };

        Category.create(category, (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: err.message || "Some error occurred while creating the Category.",
                });
            } else {
                res.send({
                    status: true,
                    message: "Category created successfully",
                    category: data,
                });
            }
        });
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const categoryId = req.params.id;

    upload1.single('category_img')(req, res, (err) => {
        if (err) {
            return res.status(500).send({
                message: "Error uploading the file.",
                error: err.message,
            });
        }

        const updatedCategory = {
            category_name: req.body.category_name,
            category_type: req.body.category_type,

            category_desc: req.body.category_desc,
            category_img: req.file ? `/uploads/category/${req.file.filename}` : req.body.category_img,
            delivery_fee_weekday: req.body.delivery_fee_weekday || 0,
            delivery_fee_weekend: req.body.delivery_fee_weekend || 0,
            holiday_fee: req.body.holiday_fee || 0,
        };

        Category.edit(categoryId, updatedCategory, (err, data) => {
            if (err) {
                if (err.message === "Category not found") {
                    return res.status(404).send({
                        message: `Category not found with id ${categoryId}.`
                    });
                } else {
                    return res.status(500).send({
                        message: "Error updating category with id " + categoryId,
                        error: err.message || "Some error occurred while updating the Category.",
                    });
                }
            } else {
                res.send({
                    status: true,
                    message: "Category updated successfully",
                    category: data,
                });
            }
        });
    });
};


exports.delete = (req, res) => {
    const categoryId = req.params.id;

    Category.delete(categoryId, (err, data) => {
        if (err) {
            if (err.message === "Category not found") {
                return res.status(404).send({
                    message: `Category not found with id ${categoryId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting category with id " + categoryId,
                    error: err.message || "Some error occurred while deleting the Category.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Category deleted successfully",
                category: data,
            });
        }
    });
};