const express = require("express");
const router = express.Router();
const product = require("../controllers/product.controller.js");

router.put("/update/:id", product.edit);

router.post("/create", product.create);

router.get("/read",product.read);

router.get("/read/:id",product.readById);


router.post("/delete/:id",product.delete);


module.exports = router;
