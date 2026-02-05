const express = require("express");
const router = express.Router();
const coupontype = require("../controllers/coupontype.controller");

router.put("/update/:id", coupontype.edit);

router.post("/create", coupontype.create);

router.get("/read", coupontype.read);

router.get("/read/:id", coupontype.readById);

router.get("/list", coupontype.renderList);


router.post("/delete/:id", coupontype.delete);


module.exports = router;
