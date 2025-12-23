const express = require("express");
const router = express.Router();
const category = require("../controllers/category.controller.js");

router.put("/update/:id", category.edit);

router.post("/create", category.create);

router.get("/read",category.read);

router.get("/read/:id",category.readById);


router.post("/delete/:id",category.delete);


module.exports = router;
