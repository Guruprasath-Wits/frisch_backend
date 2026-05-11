const express = require("express");
const router = express.Router();
const missingProduct = require("../controllers/missingProduct.controller");

router.post("/create", missingProduct.create);
router.get("/", missingProduct.findAll);
router.put("/read/:id", missingProduct.markAsRead);

module.exports = router;
