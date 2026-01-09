const express = require("express");
const router = express.Router();
const coupon = require("../controllers/coupon.controller");

router.put("/update/:id", coupon.edit);

router.post("/create", coupon.create);

router.get("/read", coupon.read);

router.get("/read/:id", coupon.readById);


router.post("/delete/:id", coupon.delete);


module.exports = router;
