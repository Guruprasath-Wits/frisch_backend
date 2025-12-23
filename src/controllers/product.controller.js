const Product = require('../services/product.services');
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

const uploadDir = path.join(__dirname, '..', 'uploads/products');

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
      upload1.single("product_img", 10)(req, res, (err) => {
        if (err) {
          return res.status(500).send({
            message: "Error uploading the files.",
            error: err,
          });
        }
    
        const product = {
            product_name: req.body.product_name,
            product_status: req.body.product_status,
            nickname: req.body.nick_name,
            product_img: req.file ? `/uploads/products/${req.file.filename}` : req.body.product_img, // Use existing image if none is uploaded
            category_id: req.body.category_id,
            desc: req.body.desc,
            price: req.body.price && req.body.price !== "null" ? parseFloat(req.body.price) : 0, // ✅ Default to 0 if null
            ingredients: req.body.ingredients,
            weight: req.body.weight && req.body.weight !== "null" ? parseFloat(req.body.weight) : 0, // ✅ Default to 0 if null
            nutri_inform: req.body.nutri_inform,
            status: req.body.status,
          };
    
        Product.create(product, (err, data) => {
          if (err) {
            res.status(500).send({
              message: err.message || "Some error occurred while creating the Product.",
            });
          } else {
            res.send({
              status: true,
              message: "Product created successfully",
              product: data,
            });
          }
        });
      });
    };


    exports.edit = (req, res) => {
        if (!validateRequestBody(req, res)) return;
    
        const productId = req.params.id;
    
        // Handle file upload if a new file is provided
        upload1.single('product_img')(req, res, (err) => {
            if (err) {
                return res.status(500).send({
                    message: "Error uploading the file.",
                    error: err.message,
                });
            }
    
            // Updated product data, handling new or existing image path
            const product = {
                product_name: req.body.product_name,
                product_status: req.body.product_status,
                nickname: req.body.nick_name,
                product_img: req.file ? `/uploads/products/${req.file.filename}` : req.body.product_img, // Use existing image if none is uploaded
                category_id: req.body.category_id,
                desc: req.body.desc ? req.body.desc : "",
                price: req.body.price && req.body.price !== "null" ? parseFloat(req.body.price) : 0, // ✅ Default to 0 if null
                ingredients: req.body.ingredients,
                weight: req.body.weight && req.body.weight !== "null" ? parseFloat(req.body.weight) : 0, // ✅ Default to 0 if null
                nutri_inform: req.body.nutri_inform ? req.body.nutri_inform : "",
                status: req.body.status && !isNaN(req.body.status) ? parseInt(req.body.status) : 0,
              };
    
            // Call the Product.edit method with updated data
            Product.edit(productId, product, (err, data) => {
                if (err) {
                    res.status(err.kind === "not_found" ? 404 : 500).send({
                        message: `Error updating product with id ${productId}.`,
                        error: err.message,
                    });
                } else {
                    res.send({
                        status: true,
                        message: "Product updated successfully",
                        product: data,
                    });
                }
            });
        });
    };
    


exports.delete = (req, res) => {
    const productId = req.params.id;

    Product.delete(productId, (err, data) => {
        if (err) {
            res.status(err.message === "Product not found" ? 404 : 500).send({
                message: `Error deleting Product with id ${productId}`,
                error: err.message,
            });
        } else {
            res.send({
                status: true,
                message: "Product deleted successfully",
                product: data,
            });
        }
    });
};

exports.read = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    Product.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Product not found",
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
                product: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;  

    
    Product.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `Product not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving Product with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                product: data,
            });
        }
    });
};
