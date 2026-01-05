const sql = require("../helpers/db.js");

const Bottle = function (bottle) {
    this.bottle_name = bottle.bottle_name;
    this.deposit = bottle.deposit;
};

Bottle.create = (newBottle, result) => {
    sql.query("INSERT INTO bottle SET ?", newBottle, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, { id: res.insertId, ...newBottle });
    });
};

Bottle.getAll = (result) => {
    sql.query("SELECT * FROM bottle", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, res);
    });
};

Bottle.updateById = (id, bottle, result) => {
    sql.query(
        "UPDATE bottle SET bottle_name = ?, deposit = ? WHERE id = ?",
        [bottle.bottle_name, bottle.deposit, id],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }
            if (res.affectedRows == 0) {
                result({ kind: "not_found" }, null);
                return;
            }
            result(null, { id: id, ...bottle });
        }
    );
};

Bottle.remove = (id, result) => {
    sql.query("DELETE FROM bottle WHERE id = ?", id, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.affectedRows == 0) {
            result({ kind: "not_found" }, null);
            return;
        }
        result(null, res);
    });
};

module.exports = Bottle;
