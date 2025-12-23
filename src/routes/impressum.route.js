const express = require("express");
const router = express.Router();
const impressum = require("../controllers/impressum.controller");

router.put("/update/:id", impressum.edit);

router.post("/create", impressum.create);

router.get("/read",impressum.read);

router.get("/read/:id",impressum.readById);


router.post("/delete/:id",impressum.delete);


module.exports = router;
