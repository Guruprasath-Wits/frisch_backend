const Holiday = require('../services/holiday.services');

exports.read = (req, res) => {
    Holiday.read((err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while fetching the holidays.",
            });
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                holidays: data,
            });
        }
    });
};

exports.create = (req, res) => {
    if (!req.body || !req.body.holiday_date) {
        return res.status(400).send({
            message: "Content can not be empty!",
        });
    }

    const holiday = {
        holiday_date: req.body.holiday_date,
    };

    Holiday.create(holiday, (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Some error occurred while creating the Holiday.",
            });
        } else {
            res.send({
                status: true,
                message: "Holiday created successfully",
                holiday: data,
            });
        }
    });
};

exports.delete = (req, res) => {
    const id = req.params.id;
    console.log("Attempting to delete holiday with ID:", id);

    Holiday.delete(id, (err, data) => {
        if (err) {
            console.error("Error deleting holiday:", err);
            if (err.message === "Holiday not found") {
                return res.status(404).send({
                    message: `Holiday not found with id ${id}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting holiday with id " + id,
                    error: err.message || "Some error occurred while deleting the Holiday.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Holiday deleted successfully",
                holiday: data,
            });
        }
    });
};
