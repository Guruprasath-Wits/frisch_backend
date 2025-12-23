const express = require("express");
const router = express.Router();
const orders = require("../controllers/orders.controller");


router.put("/update/:id", orders.edit);

router.post("/create", orders.create);

router.post("/subcreate", orders.subcreate);

router.get("/read",orders.read);

router.post("/OrderDetailsByDriver",orders.OrderDetailsByDriver);

router.post ("/storeProcessedOrders", orders.storeProcessedOrders);

router.get("/read/:id",orders.readById);

router.get("/orderDetails/:id",orders.OrderDetailsRead);

router.put("/bagUpdate/:id", orders.BagUpdate);

router.post("/delete/:id",orders.delete);

router.put("/assignDriver",orders.assignDriverToOrders);

router.post("/cancel/:id",orders.cancel);

//-------------------------------------------------------------------------------
// APP

router.get("/datefetchAll/:id",orders.datefetchAll);

//timedistancefetchComplete
router.get("/timedistancefetchComplete/:id",orders.timedistancefetchComplete);

router.get("/datefetchComplete/:id",orders.datefetchComplete);

router.get("/orderDetailsAll/:id", orders.OrderDetailsAllRead);

router.get("/driverperformanceRead",orders.driverperformanceRead);

router.put("/orderStatusUpdate/:id", orders.orderStatusUpdate);

router.post("/deliveryComplete",orders.DeliveryComplete);

router.post("/driverperformance", orders.driverperformance);

router.put("/warehouseDelete/:id",orders.warehouseDelete);

router.get("/driverhistory/:id",orders.driverhistory);

router.get("/deliverycompleteAll/",orders.deliverycompleteAll);

router.get("/orderdeli", orders.orderdeli);

router.get("/totaltimeanddistance/:id",orders.totaltimeanddistance);

router.get("/driverall/:id",orders.driverAll);

//-------------------------------------------------------------------------------



// module.exports = router;


module.exports = router;
