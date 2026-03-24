const express = require("express");
const router = express.Router();
const admins = require("../controllers/admin.controller");

router.post("/login", admins.login);

router.post("/create", admins.create);

router.put("/update/:id", admins.edit);


router.post('/permissions', admins.savePermission);


router.get('/permissions/read', admins.getPermissions);

router.get('/permissions/readPermissionId/:id', admins.getPermissionsById);



router.get("/read",admins.read);

router.get("/readById",admins.readById);


router.post("/permissions/delete/:id",admins.deletePermission);



router.put("/permissions/update/:id",admins.updatePermission);



module.exports = router;
