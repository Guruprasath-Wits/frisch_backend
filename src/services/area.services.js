const sql = require("../helpers/db.js");

const area = {};

area.read = (callback) => {
    sql.query("SELECT * FROM delivery_area", (err, results) => {
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

area.findById = (id, result) => {
    sql.query(`SELECT * FROM delivery_area WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found area: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

area.create = (newarea, result) => {
    sql.query("INSERT INTO delivery_area SET ?", newarea, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created area: ", { id: res.insertId, ...newarea });
        result(null, { id: res.insertId, ...newarea });
    });
};


area.edit = (id, updatedarea, result) => {
    const query = "UPDATE delivery_area SET  area_name = ?, zipcode = ? WHERE id = ?";

    sql.query(query, [ updatedarea.area_name, updatedarea.zipcode, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("area not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated area: ", { id: id, ...updatedarea });
        result(null, { id: id, ...updatedarea });
    });
};

area.delete = (id, result) => {
    const query = "DELETE FROM delivery_area WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("area not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted area with id: ", id);
        result(null, { id: id });
    });
};




module.exports = area;
