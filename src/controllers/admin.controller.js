const Admin = require('../services/admin.services');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require("../helpers/db");



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

    Admin.read((err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: "Admin fetch failed. No records found.",
                });
            } else {
                res.status(500).send({
                    message: err.message || "Some error occurred while fetching the data.",
                });
            }
        } else {
            res.send({
                status: true,
                message: "Fetched successfully",
                admin: data,
            });
        }
    });
};

exports.readById = (req, res) => {
  const id = req.params.id;


  area.findById(id, (err, data) => {
      if (err) {
          if (err.kind === "not_found") {
              res.status(404).send({
                  status: false,
                  message: `area not found with id ${id}`,
              });
          } else {
              res.status(500).send({
                  status: false,
                  message: `Error retrieving area with id ${id}`,
              });
          }
      } else {
          res.send({
              status: true,
              message: "Fetched Successfully",
              area: data,
          });
      }
  });
};







exports.login = async (req, res) => {
    // if (!validateRequestBody(req, res)) return;
  
    const { username, password } = req.body;
  
    Admin.login(username, async (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          return res.status(404).send({
            message: "Admin not found with provided credentials.",
          });
        } else {
          return res.status(500).send({
            message: err.message || "Some error occurred while logging in.",
          });
        }
      }
  
      const passwordIsValid = await bcrypt.compare(password, data.password);
      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Invalid password.",
        });
      }
  
      
      const token = jwt.sign({ id: data.id, email: data.email }, "lachurules", {
        expiresIn: "1h" 
      });
  
      res.send({
        status: true,
        message: "Login successful",
        token: token, 
        admin: {
          id: data.id,
          email: data.email,
          role_id:data.role_id
        }
      });
    });
  };


exports.create = async (req, res) => {
  if (!validateRequestBody(req, res)) return;

  

    const password=req.body.password;

  const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        const admin = {
            email: req.body.email,
            password: hash,
          };



  Admin.create(admin, (err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Admin.",
      });
    } else {
      res.send({
        status:true,
        message: "Admin created successfully",
        admin: data,
      });
    }
  });
};




// exports.savePermission = async (req, res) => {
//   try {
//     if (!validateRequestBody(req, res)) return;

//     const permissions = {
//       role_id: req.body.role_id,
//       access: req.body.access
//     };

//     const data = await Admin.savePermission(permissions.role_id, permissions.access);
    
//     res.send({
//       status: true,
//       message: "Permissions created successfully",
//       permissions: data
//     });
//   } catch (err) {
//     console.error('Error in savePermission controller:', err);
//     res.status(500).send({
//       status: false,
//       message: err.message || "Some error occurred while creating the Permissions."
//     });
//   }
// };
// controllers/admin.controller.js
exports.savePermission = async (req, res) => {
  try {
    if (!validateRequestBody(req, res)) return;

    const role_id = parseInt(req.body.role_id, 10);
    if (Number.isNaN(role_id)) {
      return res.status(400).send({ status: false, message: "Invalid role_id" });
    }

    const access = req.body.access || {};

    const result = await Admin.savePermission(role_id, access);

    res.send({
      status: true,
      message: "Permissions saved successfully",
      data: result
    });
  } catch (err) {
    console.error('Error in savePermission controller:', err);
    res.status(500).send({
      status: false,
      message: err.message || "Some error occurred while saving the Permissions."
    });
  }
};


exports.getPermissionsById = async (req, res) => {
  try {
    const roleId = req.params.id;
    const permissions = await Admin.findPermissionsByRoleId(roleId);

    if (permissions && permissions.length > 0) {
      res.send({
        status: true,
        permissions
      });
    } else {
      res.status(404).send({
        status: false,
        message: "No permissions found for the given role ID"
      });
    }
  } catch (err) {
    console.error("Error in getPermissionsById controller:", err);
    res.status(500).send({
      status: false,
      message: err.message || "Error retrieving permissions"
    });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Admin.getAllPermissions();
    res.send({
      status: true,
      permissions
    });
  } catch (err) {
    console.error('Error in getPermissions controller:', err);
    res.status(500).send({
      status: false,
      message: err.message || "Error retrieving permissions"
    });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    if (!validateRequestBody(req, res)) return;

    const permissions = {
      role_id: parseInt(req.body.role_id, 10),
      access: req.body.access
    };

    await Admin.updatePermissions(permissions.role_id, permissions.access);

    res.send({
      status: true,
      message: "Permissions updated successfully"
    });
  } catch (err) {
    console.error('Error in updatePermission controller:', err);
    res.status(500).send({
      status: false,
      message: err.message || "Error updating permissions"
    });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const perId = req.params.id;
    const deletedCount = await Admin.delete(perId);

    if (deletedCount > 0) {
      return res.send({
        status: true,
        message: "Permissions deleted successfully",
        per: { id: perId }
      });
    } else {
      return res.send({ // <-- not 404
        status: false,
        message: `No permissions found with id ${perId} (already deleted?)`
      });
    }
  } catch (err) {
    console.error("Error deleting permissions:", err);
    res.status(500).send({
      status: false,
      message: err.message || "Some error occurred while deleting the permissions."
    });
  }
};


exports.edit =async (req, res) => {
  if (!validateRequestBody(req, res)) return;

  const userId = req.params.id;

  const password=req.body.password;

  const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        const admin = {
            email: req.body.email,
            password: hash,
          };

  Admin.edit(userId, admin, (err, data) => {
      if (err) {
          if (err.message === "area not found") {
              return res.status(404).send({
                  message: `area not found with id ${userId}.`
              });
          } else {
              return res.status(500).send({
                  message: "Error updating area with id " + userId,
                  error: err.message || "Some error occurred while updating the area.",
              });
          }
      } else {
          res.send({
              status: true,
              message: "area updated successfully",
              admin: data,
          });
      }
  });
};
