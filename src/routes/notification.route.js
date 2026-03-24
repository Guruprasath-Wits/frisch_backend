const express = require("express");
const router = express.Router();
const notification = require("../controllers/notification.controller.js");

router.put("/update/:id", notification.edit);

router.post("/create", notification.create);

router.get("/read",notification.read);

router.get("/read/:id",notification.readById);


router.post("/delete/:id",notification.delete);


module.exports = router;
