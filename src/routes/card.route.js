const express = require("express");
const router = express.Router();
const card = require("../controllers/card.controller");

router.post("/update", card.edit);

router.post("/create", card.create);

router.get("/read",card.read);

router.get("/read/:id",card.readById);

router.get("/userCart/:user_id",card.readByUserId);

router.post("/delete/:id",card.delete);

router.post("/deleteCart/:userId",card.deleteUserProduct);


module.exports = router;