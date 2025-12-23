const express = require("express");
const router = express.Router();
const setting = require("../controllers/settings.controller");

router.put("/update/:id", setting.edit);

router.post("/create", setting.create);

router.get("/read",setting.read);

router.get("/read/:id",setting.readById);


router.post("/delete/:id",setting.delete);


module.exports = router;
