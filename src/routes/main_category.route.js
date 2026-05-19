const express = require("express");
const router = express.Router();
const mainCategory = require("../controllers/main_category.controller.js");

router.get("/read", mainCategory.read);
router.get("/read/:id", mainCategory.readById);
router.post("/create", mainCategory.create);
router.put("/update/:id", mainCategory.edit);
router.post("/delete/:id", mainCategory.delete);

module.exports = router;
