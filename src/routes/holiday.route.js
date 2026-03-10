const express = require('express');
const router = express.Router();
const holiday = require("../controllers/holiday.controller.js");

router.get("/read", holiday.read);
router.post("/create", holiday.create);
router.delete("/delete/:id", holiday.delete);

module.exports = router;
