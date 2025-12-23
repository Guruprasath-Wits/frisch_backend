const express = require("express");
const router = express.Router();
const contactUs = require("../controllers/contactUs.controller");

router.put("/update/:id", contactUs.edit);

router.post("/create", contactUs.create);

router.get("/read",contactUs.read);

router.get("/read/:id",contactUs.readById);


router.post("/delete/:id",contactUs.delete);


module.exports = router;
