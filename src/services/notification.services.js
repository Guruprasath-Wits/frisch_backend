const sql = require("../helpers/db.js");

const Notification = {};

Notification.read = (callback) => {
    sql.query("SELECT * FROM notifications", (err, results) => {
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

Notification.findById = (id, result) => {
    sql.query(`SELECT * FROM notifications WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found Notification: ", res[0]);
            result(null, res[0]);
            return;
        }

        // no category found with the id
        result({ kind: "not_found" }, null);
    });
};

Notification.create = (newNotification, result) => {
    sql.query("INSERT INTO notifications SET ?", newNotification, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created notifications: ", { id: res.insertId, ...newNotification });
        result(null, { id: res.insertId, ...newNotification });
    });
};


Notification.edit = (id, updatedNotification, result) => {
    const query = "UPDATE notifications SET  status = ? WHERE id = ?";

    sql.query(query, [ updatedNotification.status, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("Notification not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated Notification: ", { id: id, ...updatedNotification });
        result(null, { id: id, ...updatedNotification });
    });
};

Notification.delete = (id, result) => {
    const query = "DELETE FROM notifications WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            // No category found with the given ID
            const error = new Error("notifications not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted notifications with id: ", id);
        result(null, { id: id });
    });
};




module.exports = Notification;
