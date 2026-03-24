const jobs = require('../services/jobs.services.js');

const { applyJob } = require("../helpers/mailServices.js");

const validateRequestBody = (req, res) => {
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return false;
    }
    return true;
};

exports.read = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    jobs.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "jobs not found",
                });
            } else {
                res.status(500).send({
                    message: err.message || "Some error occurred while fetching the data.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                jobs: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    jobs.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `jobs not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving jobs with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                jobs: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const jobs1 = {
        title: req.body.title,
        description: req.body.description,

    };



    jobs.create(jobs1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the jobs.",
            });
        } else {
            res.send({
                status: true,
                message: "jobs created successfully",
                jobs: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const jobsId = req.params.id;

    const updatedjobs = {
        title: req.body.title,
        description: req.body.description,
    };

    jobs.edit(jobsId, updatedjobs, (err, data) => {
        if (err) {
            if (err.message === "jobs not found") {
                return res.status(404).send({
                    message: `jobs not found with id ${jobsId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating jobs with id " + jobsId,
                    error: err.message || "Some error occurred while updating the jobs.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "jobs updated successfully",
                jobs: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const jobsId = req.params.id;

    jobs.delete(jobsId, (err, data) => {
        if (err) {
            if (err.message === "jobs not found") {
                return res.status(404).send({
                    message: `jobs not found with id ${jobsId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting jobs with id " + jobsId,
                    error: err.message || "Some error occurred while deleting the jobs.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "jobs deleted successfully",
                jobs: data,
            });
        }
    });
};


exports.applyForJob = async (req, res) => {

    const jobDetails = req.body;

    const mailResult = await applyJob(jobDetails);
    if (!mailResult.success) {
        return res.status(500).send({ message: 'Error sending job application email. Please try again later.' });
    }

    res.send({ status: true, message: 'Job Application Email was send Successfully' });
    
}