const express = require('express');
const router = express.Router();
const users = require('../controllers/users.controller');

router.post('/register', users.create);
router.post('/login', users.login);
router.get('/read', users.read);
router.get('/read/:id', users.readById);
router.put('/update/:id', users.edit);
router.post('/delete/:id', users.delete);
router.post('/verify', users.verifyOtp);
router.post('/forgetPass', users.forgetPass);

router.post('/updatePass', users.updatePass);


// router.get("/read/:id",users.readById);


router.post('/loginapp', users.loginapp);
router.put('/status/:id', users.updateUserStatus);


module.exports = router;
