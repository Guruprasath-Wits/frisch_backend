const express = require("express");
const router = express.Router();
const faq = require("../controllers/faq.controller");

router.put("/update/:id", faq.edit);

router.post("/create", faq.create);

router.get("/read",faq.read);

router.get("/read/:id",faq.readById);


router.post("/delete/:id",faq.delete);


module.exports = router;
