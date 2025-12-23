const express = require("express");
const router = express.Router();
const orders = require("../controllers/subscription.controller");

router.put("/update/:id", orders.edit);

router.post("/updateOrder/:order_id",orders.updateSubscribe)

router.post("/create", orders.create);

router.get("/read",orders.read);

router.get("/Deliveryread/:id",orders.Deliveryread);

router.get("/read/:id",orders.readById);

router.get("/readOrder/:order_id",orders.readByOrderId);

router.get("/orderDetails/:id",orders.OrderDetailsRead);

router.put("/bagUpdate/:id", orders.BagUpdate);

router.post("/delete/:id",orders.delete);

router.put("/assignDriver",orders.assignDriverToOrders);

router.post("/terminate/:id",orders.terminate);

router.post("/vacation-pause/:id",orders.vacationPause);

module.exports = router;