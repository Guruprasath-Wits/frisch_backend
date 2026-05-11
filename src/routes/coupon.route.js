const express = require("express");
const router = express.Router();
const coupon = require("../controllers/coupon.controller");

router.put("/update/:id", coupon.edit);

router.post("/create", coupon.create);

router.get("/read", coupon.read);

router.get("/read/:id", coupon.readById);

router.get("/list", coupon.renderList);

router.get("/available/:userId", coupon.getAvailable);


router.post("/delete/:id", coupon.delete);
router.post("/validate", coupon.validate);




module.exports = router;
