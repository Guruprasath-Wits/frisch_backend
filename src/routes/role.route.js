const express = require("express");
const router = express.Router();
const role = require("../controllers/role.controller");

router.put("/update/:id", role.edit);

router.post("/create", role.create);

router.get("/read",role.read);

router.get("/read/:id",role.readById);


router.post("/delete/:id",role.delete);


module.exports = router;
