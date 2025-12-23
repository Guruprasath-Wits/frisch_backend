const sql = require("../helpers/db.js");

const jobs = {};

jobs.read = (callback) => {
    sql.query("SELECT * FROM jobs", (err, results) => {
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

jobs.findById = (id, result) => {
    sql.query(`SELECT * FROM jobs WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found jobs: ", res[0]);
            result(null, res[0]);
            return;
        }

        
        result({ kind: "not_found" }, null);
    });
};

jobs.create = (newjobs, result) => {
    sql.query("INSERT INTO jobs SET ?", newjobs, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        console.log("created jobs: ", { id: res.insertId, ...newjobs });
        result(null, { id: res.insertId, ...newjobs });
    });
};


jobs.edit = (id, updatedjobs, result) => {
    const query = "UPDATE jobs SET title = ?, description = ? WHERE id = ?";

    sql.query(query, [updatedjobs.title, updatedjobs.description, id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("jobs not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated jobs: ", { id: id, ...updatedjobs });
        result(null, { id: id, ...updatedjobs });
    });
};

jobs.delete = (id, result) => {
    const query = "DELETE FROM jobs WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            
            const error = new Error("jobs not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted jobs with id: ", id);
        result(null, { id: id });
    });
};




module.exports = jobs;
