const express = require("express");
const router = express.Router();
const jobs = require("../controllers/jobs.controller");

router.put("/update/:id", jobs.edit);

router.post("/create", jobs.create);

router.get("/read",jobs.read);

router.get("/read/:id",jobs.readById);

router.post("/delete/:id",jobs.delete);

router.post("/apply",jobs.applyForJob);


module.exports = router;
