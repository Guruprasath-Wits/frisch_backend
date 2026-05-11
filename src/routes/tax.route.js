const express = require("express");
const router = express.Router();
const tax = require("../controllers/tax.controller.js");

router.put("/update/:id", tax.edit);
router.post("/create", tax.create);
router.get("/read", tax.read);
router.get("/read/:id", tax.readById);
router.post("/delete/:id", tax.delete);

module.exports = router;
