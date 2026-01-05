const express = require("express");
const router = express.Router();
const bottle = require("../controllers/bottle.controller.js");

router.post("/", bottle.create);
router.get("/", bottle.findAll);
router.put("/:id", bottle.update);
router.post("/delete/:id", bottle.delete);

module.exports = router;
