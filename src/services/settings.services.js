const sql = require("../helpers/db.js");

const setting = {};

setting.read = (callback) => {
    sql.query("SELECT * FROM settings ", (err, results) => {
        if (err) {
            console.log("error:", err);
            callback(err, null);
            return;
        }

        if (results.length === 0) {
            callback({ kind: "not_found" }, null);
            return;
        }

        callback(null, results);
    });
};

setting.findById = (id, result) => {
    sql.query(`SELECT * FROM settings WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found setting: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

setting.create = (newsetting, result) => {
    sql.query("INSERT INTO settings SET ?", newsetting, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created setting: ", { id: res.insertId, ...newsetting });
        result(null, { id: res.insertId, ...newsetting });
    });
};

setting.edit = (id, updatedsetting, result) => {
    const query = `
        UPDATE settings 
        SET company_name = ?, 
            logo_img = ?, 
            banner_img = ?, 
            description = ?, 
            weekend_fee = ?, 
            weekday_fee = ?, 
            agb = ?, 
            data_protection = ?, 
            cancellation_policy = ?, 
            breaking_news = ?,
            webshop = ?,
            telephone = ?
        WHERE id = ?
    `;  // ✅ Removed the extra comma before `WHERE id = ?`

    sql.query(
        query,
        [
            updatedsetting.company_name || "",  
            updatedsetting.logo_img || "",     
            updatedsetting.banner_img || "",   
            updatedsetting.description || "",
            updatedsetting.weekend_fee || 0,   
            updatedsetting.weekday_fee || 0,
            updatedsetting.agb || "",
            updatedsetting.data_protection || "",
            updatedsetting.cancellation_policy || "",
            updatedsetting.breaking_news || "",
            updatedsetting.webshop || "",
            updatedsetting.telephone || "",
            id,  // ✅ Make sure `id` is in the last position for WHERE clause
        ],
        (err, res) => {
            if (err) {
                console.log("SQL Error: ", err);
                result(err, null);
                return;
            }

            if (res.affectedRows === 0) {
                const error = new Error("Setting not found");
                console.log("Error: ", error.message);
                result(error, null);
                return;
            }

            console.log("Updated setting: ", { id: id, ...updatedsetting });
            result(null, { id: id, ...updatedsetting });
        }
    );
};





setting.delete = (id, result) => {
    const query = "DELETE FROM settings WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("setting not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted setting with id: ", id);
        result(null, { id: id });
    });
};




module.exports = setting;
