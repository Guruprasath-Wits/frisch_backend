const setting = require('../services/settings.services');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { log } = require('console');



const validateRequestBody = (req, res) => {
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!",
        });
        return false;
    }
    return true;
};

// const uploadDir = path.join(__dirname, '..', 'uploads/settings');
const uploadDir = path.join(__dirname, '..', 'uploads/settings');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    },
});


const upload1 = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    },
});


exports.read = (req, res) => {
    if (!validateRequestBody(req, res)) return;

    setting.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "setting not found",
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
                setting: data,
            });
        }
    });
};

exports.readById = (req, res) => {
    const id = req.params.id;


    setting.findById(id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    status: false,
                    message: `setting not found with id ${id}`,
                });
            } else {
                res.status(500).send({
                    status: false,
                    message: `Error retrieving setting with id ${id}`,
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched Successfully",
                setting: data,
            });
        }
    });
};

exports.create = async (req, res) => {
    if (!validateRequestBody(req, res)) return;

    // Handle multiple file uploads: 'logo_img' and 'banner_img'
    upload1.fields([
        { name: 'logo_img', maxCount: 1 },
        { name: 'banner_img', maxCount: 100 }
    ])(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(500).send({
                message: "Error uploading the file(s).",
                error: err.message
            });
        }

        if (!validateRequestBody(req, res)) return;

        const settings = {
            company_name: req.body.company_name,
            logo_img: req.files['logo_img'] ? `/uploads/settings/${req.files['logo_img'][0].filename}` : null,
            banner_img: req.files['banner_img']
  ? req.files['banner_img'].map(file => `/uploads/settings/${file.filename}`).join(',')
  : req.body.banner_img,
            description: req.body.description,
            agb: req.body.agb,
            data_protection: req.body.data_protection,
            cancellation_policy: req.body.cancellation_policy,
            breaking_news : req.body.breaking_news,
            webshop : req.body.webshop,
            telephone : req.body.telephone
          
        };

        setting.create(settings, (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: err.message || "Some error occurred while creating the setting.",
                });
            } else {
                res.send({
                    status: true,
                    message: "Setting created successfully",
                    settings: data,
                });
            }
        });
    });
};

exports.edit = (req, res) => {
  upload1.fields([
    { name: 'logo_img', maxCount: 1 },
    { name: 'banner_img', maxCount: 100 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(500).send({
        message: "Error uploading the file(s).",
        error: err.message,
      });
    }

    const settingId = req.params.id;

    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    // ✅ Handle logo (either keep old or new)
    const logoImg = req.files['logo_img']
      ? `/uploads/settings/${req.files['logo_img'][0].filename}`
      : req.body.logo_img;

    // ✅ 1️⃣ Extract old banners from request (existing_banners)
    let existingBanners = [];
    if (req.body.existing_banners && req.body.existing_banners !== 'null') {
      existingBanners = req.body.existing_banners.split(',').map(b => b.trim());
    }

    // ✅ 2️⃣ Extract new banner uploads
    let newBannerPaths = [];
    if (req.files && req.files['banner_img']) {
      newBannerPaths = req.files['banner_img'].map(file => `/uploads/settings/${file.filename}`);
    }

    // ✅ 3️⃣ Merge both (old + new)
    const finalBannerList = [...existingBanners, ...newBannerPaths];

    // ✅ 4️⃣ Prepare updated object
    const updatedSetting = {
      company_name: req.body.company_name,
      logo_img: logoImg,
      banner_img: finalBannerList.join(','),
      description: req.body.description,
      weekend_fee: req.body.weekend_fee,
      weekday_fee: req.body.weekday_fee,
      agb: req.body.agb,
      data_protection: req.body.data_protection,
      cancellation_policy: req.body.cancellation_policy,
      breaking_news: req.body.breaking_news,
      webshop: req.body.webshop,
      telephone: req.body.telephone
    };

    console.log("✅ Final merged banner list:", finalBannerList);

    // ✅ 5️⃣ Update in DB
    setting.edit(settingId, updatedSetting, (err, data) => {
      if (err) {
        if (err.message === "setting not found") {
          return res.status(404).send({
            message: `Setting not found with id ${settingId}.`,
          });
        } else {
          return res.status(500).send({
            message: "Error updating setting with id " + settingId,
            error: err.message || "Some error occurred while updating the setting.",
          });
        }
      } else {
        res.send({
          status: true,
          message: "Setting updated successfully",
          setting: data,
        });
      }
    });
  });
};







exports.delete = (req, res) => {
    const settingId = req.params.id;

    setting.delete(settingId, (err, data) => {
        if (err) {
            if (err.message === "setting not found") {
                return res.status(404).send({
                    message: `setting not found with id ${settingId}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error deleting setting with id " + settingId,
                    error: err.message || "Some error occurred while deleting the setting.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "setting deleted successfully",
                setting: data,
            });
        }
    });
};