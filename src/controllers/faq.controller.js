const faq = require('../services/faq.services');



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

    faq.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "faq not found",
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
                faq: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    faq.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `faq not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving faq with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                faq: data,
            });
        }
    });
};



exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;


    const faq1 = {
        faq_qns: req.body.faq_qns,
        faq_ans: req.body.faq_ans,

    };



    faq.create(faq1, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the faq.",
            });
        } else {
            res.send({
                status: true,
                message: "faq created successfully",
                faq: data,
            });
        }
    });
};


exports.edit = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    const faqId = req.params.id;

    const updatedfaq = {
        faq_qns: req.body.faq_qns,
        faq_ans: req.body.faq_ans,
    };

    faq.edit(faqId, updatedfaq, (err, data) => {
        if (err) {
            if (err.message === "faq not found") {
                return res.status(404).send({
                    message: `faq not found with id ${faqId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating faq with id " + faqId,
                    error: err.message || "Some error occurred while updating the faq.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "faq updated successfully",
                faq: data,
            });
        }
    });
};



exports.delete = (req, res) => {
    const faqId = req.params.id;

    faq.delete(faqId, (err, data) => {
        if (err) {
            if (err.message === "faq not found") {
                return res.status(404).send({
                    message: `faq not found with id ${faqId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting faq with id " + faqId,
                    error: err.message || "Some error occurred while deleting the faq.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "faq deleted successfully",
                faq: data,
            });
        }
    });
};