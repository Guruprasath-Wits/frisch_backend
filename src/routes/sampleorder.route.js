const express = require("express");
const router = express.Router();
const sampleOrder = require("../controllers/sampleorder.controller");

router.put("/update/:id", sampleOrder.edit);

router.post("/create", sampleOrder.create);

router.get("/read",sampleOrder.read);

router.get("/read/:id",sampleOrder.readById);


router.post("/delete/:id",sampleOrder.delete);

router.post("/upload-image", sampleOrder.uploadImage);


module.exports = router;