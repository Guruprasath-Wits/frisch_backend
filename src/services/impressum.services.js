const sql = require("../helpers/db.js");

const impressum = {};

impressum.read = (callback) => {
    sql.query("SELECT * FROM impressum", (err, results) => {
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

impressum.findById = (id, result) => {
    sql.query(`SELECT * FROM impressum WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found impressum: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

impressum.create = (newimpressum, result) => {
    sql.query("INSERT INTO impressum SET ?", newimpressum, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created impressum: ", { id: res.insertId, ...newimpressum });
        result(null, { id: res.insertId, ...newimpressum });
    });
};




impressum.edit = (id, updatedimpressum, result) => {
    const query = `
        UPDATE impressum 
        SET name = ?, company_name = ?, address = ?, tel = ?, email = ?, 
            business_type = ?, platform = ?, link = ?, notes = ?, privacy_policy = ?
        WHERE id = ?
    `;

    sql.query(
        query,
        [
            updatedimpressum.name,
            updatedimpressum.company_name,
            updatedimpressum.address,
            updatedimpressum.tel,
            updatedimpressum.email,
            updatedimpressum.business_type,
            updatedimpressum.platform,
            updatedimpressum.link,
            updatedimpressum.notes,
            updatedimpressum.privacy_policy,
            id,
        ],
        (err, res) => {
            if (err) {
                console.error("Database Error: ", err.message);
                result(err, null);
                return;
            }

            if (res.affectedRows === 0) {
                console.warn(`No record found with id: ${id}`);
                result(new Error("Impressum not found"), null);
                return;
            }

            console.log("Updated impressum: ", { id: id, ...updatedimpressum });
            result(null, { id: id, ...updatedimpressum });
        }
    );
};



impressum.delete = (id, result) => {
    const query = "DELETE FROM impressum WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("impressum not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted impressum with id: ", id);
        result(null, { id: id });
    });
};




module.exports = impressum;
