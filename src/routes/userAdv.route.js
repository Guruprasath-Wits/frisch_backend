const express = require("express");
const router = express.Router();
const userAdv = require("../controllers/userAdv.controller");

router.put("/update/:id", userAdv.edit);

router.post("/create", userAdv.create);

router.get("/read",userAdv.read);

router.get("/read/:id",userAdv.readById);


router.post("/delete/:id",userAdv.delete);


module.exports = router;
