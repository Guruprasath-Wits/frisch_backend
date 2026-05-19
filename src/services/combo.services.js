const db = require('../helpers/db');


async function query(sql, params) {
    const [results,] = await db.promise().execute(sql, params);
    return results;
}

async function getAllCombos() {
    const sql = 'SELECT * FROM combo_packs ORDER BY created_at ASC';
    return await query(sql);
}

async function getComboById(id) {
    const sql = 'SELECT * FROM combo_packs WHERE id = ?';
    const rows = await query(sql, [id]);
    return rows[0];
}

async function createCombo(data) {
    const sql = `
    INSERT INTO combo_packs (name, price, description, status, image, product_ids, discount_percentage, nutritional_info, ingredients, availability, vat, pfand, nickname)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    let productIds = data.product_ids;
    if (typeof productIds !== 'string') {
        productIds = JSON.stringify(productIds);
    }

    const params = [
        data.name,
        data.price,
        data.description,
        data.status,
        data.image,
        productIds,
        data.discount_percentage,
        data.nutritional_info,
        data.ingredients,
        data.availability,
        data.vat,
        data.pfand,
        data.nickname
    ];
    const result = await query(sql, params);
    return { id: result.insertId, ...data };
}

async function updateCombo(id, data) {
    const sql = `
    UPDATE combo_packs 
    SET name = ?, price = ?, description = ?, status = ?, image = ?, product_ids = ?, discount_percentage = ?, nutritional_info = ?, ingredients = ?, availability = ?, vat = ?, pfand = ?, nickname = ?
    WHERE id = ?
  `;

    let productIds = data.product_ids;
    if (typeof productIds !== 'string') {
        productIds = JSON.stringify(productIds);
    }

    const params = [
        data.name,
        data.price,
        data.description,
        data.status,
        data.image,
        productIds,
        data.discount_percentage,
        data.nutritional_info,
        data.ingredients,
        data.availability,
        data.vat,
        data.pfand,
        data.nickname,
        id
    ];
    await query(sql, params);
    return { id, ...data };
}

async function deleteCombo(id) {
    const sql = 'DELETE FROM combo_packs WHERE id = ?';
    return await query(sql, [id]);
}

async function checkComboNameExists(name, excludeId = null) {
    let sql = 'SELECT id FROM combo_packs WHERE LOWER(name) = LOWER(?)';
    const params = [name];

    if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
    }

    const rows = await query(sql, params);
    return rows.length > 0;
}

module.exports = {
    getAllCombos,
    getComboById,
    createCombo,
    updateCombo,
    deleteCombo,
    checkComboNameExists
};
