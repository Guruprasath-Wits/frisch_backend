const express = require('express');
const router = express.Router();
const comboController = require('../controllers/combo.controller');

router.get('/', comboController.getAllCombos);
router.get('/:id', comboController.getComboById);
router.post('/', comboController.createCombo);
router.put('/:id', comboController.updateCombo);
router.delete('/:id', comboController.deleteCombo);

module.exports = router;
