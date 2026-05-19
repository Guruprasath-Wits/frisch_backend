const sql = require("../helpers/db.js");

const coupon = {};

coupon.read = (callback) => {
    sql.query("SELECT * FROM coupon", (err, results) => {
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

coupon.findById = (id, result) => {
    sql.query(`SELECT * FROM coupon WHERE id = ?`, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length) {
            console.log("found coupon: ", res[0]);
            result(null, res[0]);
            return;
        }


        result({ kind: "not_found" }, null);
    });
};

coupon.create = (newcoupon, result) => {
    // First, check if a coupon with the same code already exists
    sql.query("SELECT * FROM coupon WHERE couponcode = ?", [newcoupon.couponcode], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        // If a coupon with this code already exists, return an error
        if (res.length > 0) {
            const error = new Error("Coupon with this code already exists");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        // If no duplicate, proceed with insertion
        sql.query("INSERT INTO coupon SET ?", newcoupon, (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            console.log("created coupon: ", { id: res.insertId, ...newcoupon });
            result(null, { id: res.insertId, ...newcoupon });
        });
    });
};


coupon.edit = (id, updatedcoupon, result) => {
    const query = "UPDATE coupon SET type = ?, description = ?, couponcode = ?, discount_percentage = ?, user_email = ?, from_date = ?, end_date = ? WHERE id = ?";

    sql.query(query, [
        updatedcoupon.type,
        updatedcoupon.description,
        updatedcoupon.couponcode,
        updatedcoupon.discount_percentage,
        updatedcoupon.user_email,
        updatedcoupon.from_date,
        updatedcoupon.end_date,
        id
    ], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            const error = new Error("coupon not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("updated coupon: ", { id: id, ...updatedcoupon });
        result(null, { id: id, ...updatedcoupon });
    });
};

coupon.delete = (id, result) => {
    const query = "DELETE FROM coupon WHERE id = ?";

    sql.query(query, [id], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {

            const error = new Error("coupon not found");
            console.log("error: ", error.message);
            result(error, null);
            return;
        }

        console.log("deleted coupon with id: ", id);
        result(null, { id: id });
    });
};




coupon.validate = (couponCode, userId, result) => {
    sql.query("SELECT * FROM coupon WHERE couponcode = ?", [couponCode], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        if (res.length === 0) {
            result(null, { status: false, message: "not valid" });
            return;
        }

        const couponData = res[0];
        const currentDate = new Date();
        const fromDate = new Date(couponData.from_date);
        const endDate = new Date(couponData.end_date);

        // Date validation
        if (currentDate < fromDate || currentDate > endDate) {
            result(null, { status: false, message: "not valid" });
            return;
        }

        // 1. User specific money voucher
        if (couponData.user_email) {
            sql.query("SELECT email FROM users WHERE id = ?", [userId], (err, userRes) => {
                if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                }

                // [MODIFIED BY CO-PILOT 2026-02-01]: Added check for payment_status to prevent reuse
                /* 
                // OLD LOGIC (Before 2026-02-01)
                if (userRes.length && userRes[0].email === couponData.user_email) {
                    result(null, {
                        status: true,
                        approve: "uservoucher",
                        couponCode: couponData.couponcode,
                        discount_percentage: couponData.discount_percentage
                    });
                } else {
                    result(null, { status: false, message: "not valid" });
                } 
                */

                // NEW LOGIC
                if (userRes.length && userRes[0].email === couponData.user_email) {
                    // Check if the user has already used this coupon successfully
                    sql.query("SELECT * FROM orders WHERE user_id = ? AND couponCode = ? AND payment_status = 'success'", [userId, couponCode], (err, orderRes) => {
                        if (err) {
                            console.log("error checking previous usage: ", err);
                            result(err, null);
                            return;
                        }

                        if (orderRes.length > 0) {
                            result(null, { status: false, message: "Coupon already redeemed" });
                        } else {
                            result(null, {
                                status: true,
                                approve: couponData.type, // Use the actual type from DB 'Geldgutschein(Benutzerspezifisch)'
                                couponCode: couponData.couponcode,
                                discount_percentage: couponData.discount_percentage
                            });
                        }
                    });
                } else {
                    result(null, { status: false, message: "not valid" });
                }
            });
            return;
        }

        // 2. Free shipping
        if (couponData.type === 'Versandkostenfrei') {
            result(null, {
                status: true,
                approve: "Versandkostenfrei"
            });
            return;
        }

        // 3. Percentage
        if (couponData.type === 'Prozentrabatt') {
            result(null, {
                status: true,
                approve: "Prozentrabatt",
                discount_percentage: couponData.discount_percentage
            });
            return;
        }

        // Default: not valid
        result(null, { status: false, message: "not valid" });
    });
};



coupon.getAvailable = (userId, result) => {
    // 1. Get user email first
    sql.query("SELECT email FROM users WHERE id = ?", [userId], (err, userRes) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }

        let userEmail = null;
        if (userRes.length > 0) {
            userEmail = userRes[0].email;
        }

        // 2. Query coupons
        // Logic:
        // - Coupon must be valid by date (from_date <= NOW <= end_date)
        // - Coupon must be either:
        //      a) Assigned to this user (user_email = userEmail)
        //      b) Common coupon (user_email IS NULL or user_email = '')

        // [MODIFIED BY CO-PILOT 2026-02-01]: Added LEFT JOIN to exclude used coupons
        /*
        // OLD LOGIC
        let query = `
            SELECT * FROM coupon 
            WHERE 
            (
                (user_email = ? AND user_email IS NOT NULL AND user_email != '') 
                OR 
                (user_email IS NULL OR user_email = '')
            )
            AND from_date <= CURDATE() 
            AND end_date >= CURDATE()
        `;
        */

        let query = `
            SELECT c.* 
            FROM coupon c
            LEFT JOIN orders o ON c.couponcode = o.couponCode AND o.user_id = ? AND o.payment_status = 'success'
            WHERE 
            (
                (c.user_email = ? AND c.user_email IS NOT NULL AND c.user_email != '') 
                OR 
                (c.user_email IS NULL OR c.user_email = '')
            )
            AND c.from_date <= CURDATE() 
            AND c.end_date >= CURDATE()
            AND (o.order_id IS NULL OR c.type != 'Geldgutschein(Benutzerspezifisch)') 
        `;

        sql.query(query, [userId, userEmail], (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            result(null, res);
        });
    });
};

module.exports = coupon;
