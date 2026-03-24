const sampleOrder = require('../services/sampleorder.services');

const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/products');  // Ensure 'uploads' folder exists
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// This must be OUTSIDE the controller function
const upload = multer({ storage });


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

    sampleOrder.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "sampleOrder not found",
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
                sampleOrder: data,
            });
        }
    });
};


    // exports.read = (req, res) => {
    //     if (!validateRequestBody(req, res)) return;

    //     sampleOrder.read((err, data) => {
    //         if (err) {
    //             if (err.kind === "not_found") {
    //                 res.status(404).send({
    //                     message: "sampleOrder not found",
    //                 });
    //             } else {
    //                 res.status(500).send({
    //                     message: err.message || "Some error occurred while fetching the data.",
    //                 });
    //             }
    //         } else {
    //             res.send({
    //                 status: true,
    //                 message: "Fetched Successfully",
    //                 sampleOrder: data,
    //             });
    //         }
    //     });
    // };

exports.readById = (req, res) => {
    const id = req.params.id;

    sampleOrder.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `sampleOrder not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving sampleOrder with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                sampleOrder: data,
            });
        }
    });
};


exports.create = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const { desc, description, products, product_img } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).send({ message: "Products array required" });
    }

    // Correct parameter order
    sampleOrder.create(desc, description, product_img, products, (err, data) => {
        if (err) {
            res.status(500).send({ message: err.message });
        } else {
            res.send({ status: true, message: "Sample Order Created", data });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const sampleOrderId = req.body.id;

    const updatedsampleOrder = {
        products: req.body.products || [],  // Array of objects [{id, name}]
        desc: req.body.desc,
        description: req.body.description,
        product_img: req.body.product_img || null  // ✅ Include product_img
    };

    sampleOrder.edit(sampleOrderId, updatedsampleOrder, (err, data) => {
        if (err) {
            if (err.message === "sampleOrder not found") {
                return res.status(404).send({ message: `sampleOrder not found with id ${sampleOrderId}.` });
            } else {
                return res.status(500).send({
                    message: "Error updating sampleOrder with id " + sampleOrderId,
                    error: err.message || "Some error occurred while updating the sampleOrder.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "sampleOrder updated successfully",
                sampleOrder: data,
            });
        }
    });
};



exports.uploadImage = (req, res) => {
    const uploadSingle = upload.single('product_img');

    uploadSingle(req, res, function (err) {
        if (err) {
            return res.status(500).send({
                status: false,
                message: "Error uploading image",
                error: err.message || "Unexpected error"
            });
        }

        if (!req.file) {
            return res.status(400).send({
                status: false,
                message: "No file uploaded"
            });
        }

        res.send({
            status: true,
            message: "Image uploaded successfully",
            filePath: req.file.filename  // You can send full URL if required
        });
    });
};


exports.delete = (req, res) => {
    const sampleOrderId = req.params.id;

    sampleOrder.delete(sampleOrderId, (err, data) => {
        if (err) {
            if (err.message === "sampleOrder not found") {
                return res.status(404).send({
                    message: `sampleOrder not found with id ${sampleOrderId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting sampleOrder with id " + sampleOrderId,
                    error: err.message || "Some error occurred while deleting the sampleOrder.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "sampleOrder deleted successfully",
                sampleOrder: data,
            });
        }
    });
};