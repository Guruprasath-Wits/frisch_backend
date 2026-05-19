const Bottle = require("../services/bottle.services.js");

exports.create = (req, res) => {
    if (!req.body) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    const bottle = new Bottle({
        bottle_name: req.body.bottle_name,
        deposit: req.body.deposit
    });

    Bottle.create(bottle, (err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Bottle."
            });
        else res.send({ status: true, message: "Bottle created successfully", bottle: data });
    });
};

exports.findAll = (req, res) => {
    Bottle.getAll((err, data) => {
        if (err)
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving bottles."
            });
        else res.send({ status: true, bottle: data });
    });
};

exports.update = (req, res) => {
    if (!req.body) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    Bottle.updateById(
        req.params.id,
        new Bottle(req.body),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({ message: `Not found Bottle with id ${req.params.id}.` });
                } else {
                    res.status(500).send({ message: "Error updating Bottle with id " + req.params.id });
                }
            } else res.send({ status: true, message: "Bottle updated successfully", bottle: data });
        }
    );
};

exports.delete = (req, res) => {
    Bottle.remove(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({ message: `Not found Bottle with id ${req.params.id}.` });
            } else {
                res.status(500).send({ message: "Could not delete Bottle with id " + req.params.id });
            }
        } else res.send({ status: true, message: `Bottle was deleted successfully!` });
    });
};
