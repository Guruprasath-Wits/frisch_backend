const express = require("express");
const router = express.Router();
const address = require("../controllers/address.controller");


router.post("/create", address.create);

router.post("/creates", address.creates);

router.get("/read",address.read);

router.get("/read/:id",address.readById);

router.post("/delete/:id",address.delete);



module.exports = router;
