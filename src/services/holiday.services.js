const sql = require("../helpers/db.js");

const Holiday = {};

Holiday.read = (callback) => {
    sql.query("SELECT * FROM holiday ORDER BY holiday_date ASC", (err, results) => {
        if (err) {
            console.log("error:", err);
            callback(err, null);
            return;
        }

        callback(null, results);
    });
};

Holiday.create = (newHoliday, result) => {
    sql.query("INSERT INTO holiday SET ?", newHoliday, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created holiday: ", { id: res.insertId, ...newHoliday });
        result(null, { id: res.insertId, ...newHoliday });
    });
};

Holiday.delete = (id, result) => {
    const query = "DELETE FROM holiday WHERE id = ?";
    console.log("Executing SQL:", query, "with ID:", id);

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("Holiday not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted holiday with id: ", id);
        result(null, { id: id });
    });
};

module.exports = Holiday;
