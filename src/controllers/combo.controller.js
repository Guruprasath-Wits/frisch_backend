const comboService = require('../services/combo.services');
const multer = require('multer');
const path = require('path');

// Configure Multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/combo/');
    },
    filename: (req, file, cb) => {
        cb(null, 'combo-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

async function getAllCombos(req, res, next) {
    try {
        const combos = await comboService.getAllCombos();
        res.json({ success: true, combos });
    } catch (err) {
        console.error('Error getting combos:', err);
        next(err);
    }
}

async function getComboById(req, res, next) {
    try {
        const combo = await comboService.getComboById(req.params.id);
        if (!combo) {
            return res.status(404).json({ success: false, message: 'Combo not found' });
        }
        res.json({ success: true, combo });
    } catch (err) {
        console.error('Error getting combo:', err);
        next(err);
    }
}

async function createCombo(req, res, next) {
    try {
        const imagePath = req.file ? '/uploads/combo/' + req.file.filename : '';
        const comboData = {
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            status: req.body.status === '1' || req.body.status === true ? 1 : 0,
            image: imagePath,
            product_ids: req.body.product_ids ? JSON.parse(req.body.product_ids) : [],
            discount_percentage: req.body.discount_percentage || 0,
            nutritional_info: req.body.nutritional_info || '',
            ingredients: req.body.ingredients || '',
            availability: req.body.availability || 'Available',
            vat: req.body.vat || 0,
            pfand: req.body.pfand || 0,
            nickname: req.body.nickname || ''
        };

        const nameExists = await comboService.checkComboNameExists(comboData.name);
        if (nameExists) {
            return res.status(400).json({ success: false, message: 'Combo name already exists' });
        }

        const newCombo = await comboService.createCombo(comboData);
        res.json({ success: true, message: 'Combo created successfully', combo: newCombo });
    } catch (err) {
        console.error('Error creating combo:', err);
        next(err);
    }
}

async function updateCombo(req, res, next) {
    try {
        const existingCombo = await comboService.getComboById(req.params.id);
        if (!existingCombo) {
            return res.status(404).json({ success: false, message: 'Combo not found' });
        }

        const imagePath = req.file ? '/uploads/combo/' + req.file.filename : (req.body.image || existingCombo.image);

        const comboData = {
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            status: req.body.status === '1' || req.body.status === true ? 1 : 0,
            image: imagePath,
            product_ids: req.body.product_ids ? JSON.parse(req.body.product_ids) : [],
            discount_percentage: req.body.discount_percentage || 0,
            nutritional_info: req.body.nutritional_info || '',
            ingredients: req.body.ingredients || '',
            availability: req.body.availability || 'Available',
            vat: req.body.vat || 0,
            pfand: req.body.pfand || 0,
            nickname: req.body.nickname || ''
        };

        const nameExists = await comboService.checkComboNameExists(comboData.name, req.params.id);
        if (nameExists) {
            return res.status(400).json({ success: false, message: 'Combo name already exists' });
        }

        const updatedCombo = await comboService.updateCombo(req.params.id, comboData);
        res.json({ success: true, message: 'Combo updated successfully', combo: updatedCombo });
    } catch (err) {
        console.error('Error updating combo:', err);
        next(err);
    }
}

async function deleteCombo(req, res, next) {
    try {
        await comboService.deleteCombo(req.params.id);
        res.json({ success: true, message: 'Combo deleted successfully' });
    } catch (err) {
        console.error('Error deleting combo:', err);
        next(err);
    }
}

module.exports = {
    getAllCombos,
    getComboById,
    createCombo: [upload.single('image'), createCombo],
    updateCombo: [upload.single('image'), updateCombo],
    deleteCombo
};
