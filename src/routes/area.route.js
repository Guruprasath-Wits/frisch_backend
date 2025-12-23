const express = require("express");
const router = express.Router();
const area = require("../controllers/area.controller");

router.put("/update/:id", area.edit);

router.post("/create", area.create);

router.get("/read",area.read);

router.get("/read/:id",area.readById);


router.post("/delete/:id",area.delete);


module.exports = router;
