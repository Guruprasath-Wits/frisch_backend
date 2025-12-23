const nodemailer = require("nodemailer");
require("dotenv").config(); // Ensure to load environment variables from .env file

// Create and export a function to send OTP emails
exports.sendOtpEmail = async (toEmail, otp) => {
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de", // IONOS SMTP server
      port: 465, // Secure SSL port
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: {
        rejectUnauthorized: false, // Bypass SSL issues
      },
    });
    // Configure the email options with HTML content
    const mailOptions = {
      from: '"Frisch für Sie" <info@frischfuersie.de>',
      to: toEmail,
      subject: "Willkommen bei Frisch für Sie!",
      html: `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css"
    integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />
<div
    style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
    <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 30px;color: #000;">Frisch für Sie</h1>
    </div>
    <p style="font-size: 16px; color: #333;">Vielen Dank, dass Sie sich bei uns registriert haben. Wir freuen uns, Sie
        an Bord zu haben!</p>
    <p style="font-size: 16px; color: #555; margin: 20px 0;">Bitte verwenden Sie das folgende Bestätigungscode, um Ihre
        Kontobestätigung abzuschließen:</p>
    <div style="font-size: 48px; color: #FF5722; font-weight: bold; margin: 20px 0;">${otp}</div>
    <!-- <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes.</p> -->
    <hr style="border: 1px solid #ddd; margin: 20px 0;" />
    <p style="font-size: 12px; color: #999;">
        Wenn Sie diese Anfrage nicht initiiert haben, ignorieren Sie bitte diese E-Mail oder wenden Sie sich an den
        Support.</p>
   <div style="padding: 20px 0px 10px 0px; border-radius: 15px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">
    <div style="text-align: center;">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
</div>

    <br>
    <div>
        <p style="text-align: center; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
    </div>
</div>

</div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, message: "Failed to send OTP email" };
  }
};

// Create and export a function to send password reset emails
exports.sendForgetPass = async (toEmail, link) => {
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de", // IONOS SMTP server
      port: 465, // Secure SSL port
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: {
        rejectUnauthorized: false, // Bypass SSL issues
      },
    });
    console.log("22")
    // Configure the email options with HTML content
    const mailOptions = {
      from: '"Frisch für Sie" <info@frischfuersie.de>', // Replace with actual sender email
      to: toEmail,
      subject: 'Passwort zurücksetzen',
      html: `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css"
    integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />
<div
    style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: auto;">
    <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 30px;color: #000;">Frisch für Sie</h1>
    </div>
    <p style="font-size: 16px; color: #333;">Es sieht so aus, als hätten Sie Ihr Passwort für 'Frisch für Sie' vergessen. Bitte klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen.
    </p><br>
    <a href="https://frischfuersie.de/forgetPass?email=${toEmail}"
         style="display: inline-block;
                font-size: 14px;
                color: #ffffff;
                text-decoration: none;
                background-color: blue;
                padding: 12px 20px;
                border-radius: 7px;
                white-space: nowrap;
                max-width: 100%;
                box-sizing: border-box;">
        Setzen Sie bitte Ihr Passwort zurück.
      </a>
    <br><br><br>
    <!-- <p style="font-size: 14px; color: #888;">This link will expire in 1 hour.</p> -->
    <img src="https://api.frischfuersie.de/uploads/settings/reset_img.jpg" alt="Sample_image" width="100%" height="300">
    <hr style="border: 1px solid #ddd; margin: 20px 0;" />
    <p style="font-size: 12px; color: #999;">Wenn Sie Ihr Passwort nicht vergessen haben, können Sie diese E-Mail
        getrost ignorieren.</p>
     <div style="padding: 20px 0px 10px 0px; border-radius: 15px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">
    <div style="text-align: center;">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
</div>

    <br>
    <div>
        <p style="text-align: center; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
    </div>
</div>
</div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Password reset link sent successfully" };
  } catch (error) {
    console.error("Error sending reset link email:", error);
    return { success: false, message: "Failed to send reset link email" };
  }
};

// Create and export a function to registered Successfull
exports.registered = async (toEmail) => {
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de", // IONOS SMTP server
      port: 465, // Secure SSL port
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: {
        rejectUnauthorized: false, // Bypass SSL issues
      },
    });
    // Configure the email options with HTML content
    const mailOptions = {
      from: '"Frisch für Sie" <info@frischfuersie.de>', // Display name with the sender address
      to: toEmail,
      subject: "Herzlich willkommen an Bord! Deine süße Reise beginnt jetzt",
      html: `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css"
    integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />

<body
    style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; text-align: center; color: #333;">
    <div
        style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">

        <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 30px;color: #000;">Frisch für Sie</h1>
        </div><br>
        <!-- Image Section -->
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://api.frischfuersie.de/uploads/settings/reset_img.jpg" alt="Frisch für Sie" width="100%" height="300px" style="border-radius: 10px;">
            <p style="font-size: 16px; color: #000;font-weight: 600; margin-top: 10px;text-align: left;">Hallo und
                herzlich willkommen bei <span style="color: orange;">Frisch für Sie</span></p>
            <!-- <p style="text-align: justify;">Herzlich willkommen an Bord! Deine süße Reise beginnt jetzt.</p> -->
            <p style="text-align: justify;">Starten Sie entspannt in den Tag. Mit unserem Lieferservice erhalten Sie
                frische Backwaren, Eier und köstliche Aufstriche direkt vor die Haustür. Bestellen Sie noch heute und
                genießen Sie Ihr Frühstück in Ruhe.
            </p>
            <a href="https://frischfuersie.de/auth"
                style="background-color: orange;padding: 10px 20px;border: 0;border-radius: 5px;font-weight: 600;color: #fff;text-decoration: none;">LOS
                GEHTS</a>
        </div>
          <div style="padding: 20px 0px 10px 0px; border-radius: 15px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">
   <div style="text-align: center;">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
</div>
    <br>
    <div>
        <p style="text-align: center; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
    </div>
</div>
    </div>
</body>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, message: "Failed to send OTP email" };
  }
};




exports.orderConfirmMail = async (orderData, productDetails, userData) => {
  try {
    console.log("User Data:", userData);
    console.log("Order Data:", orderData);
    console.log("productDetails", productDetails);

    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de",
      port: 465,
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: { rejectUnauthorized: false },
    });
const formatToLocalDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};


const deliveryDate = formatToLocalDate(orderData.delivery_date);
console.log("Deliver Date is", deliveryDate);


    // Fees & totals
    const deliveryFee = parseFloat(orderData.deliveryFee) || 0;
    const tips = parseFloat(orderData.tips) || 0;
    const price = parseFloat(orderData.price) || 0;
    const totalAmount = (price + tips + deliveryFee).toFixed(2);

    // Products
    const productRows = productDetails
      .map(([name, quantity, unitPrice]) => {
        let totalPrice = (
          parseFloat(quantity) * parseFloat(unitPrice)
        ).toFixed(2);

        if (isNaN(totalPrice)) totalPrice = "0.00";

        return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: left;">${name}</td>
          <td style="padding: 10px; text-align: right;">${quantity}</td>
          <td style="padding: 10px; text-align: right;">${totalPrice} €</td>
        </tr>`;
      })
      .join("");

    // Mail
    const mailOptions = {
      from: '"Frisch für Sie" <info@frischfuersie.de>',
      to: userData.email,
      subject: "Bestellbestätigung - Frisch für Sie",
      html: `
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; text-align: center; color: #333;">
          <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
            <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 30px; color: #000;">Frisch für Sie</h1>
            </div>
            <div style="margin: 20px 0;">
              <p style="text-align: left;">Hallo, ${userData.username},</p>
              <img src="https://api.frischfuersie.de/uploads/settings/reset_img.jpg" alt="Frisch für Sie" width="100%" height="300px" style="border-radius: 10px;">
              <p>Vielen Dank für Ihre Bestellung!</p>
              <div style="text-align: left; margin-bottom: 20px;">
                <p><strong>Name:</strong> ${userData.username}</p>
               <p><strong>Lieferadresse:</strong> 
  ${orderData.address}
</p>

                <p><strong>Bestellnummer:</strong> ${orderData.order_id}</p>
                <p><strong>Liefertermin:</strong> ${deliveryDate}</p>
              </div>
              <div style="margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; margin: 0 auto;">
                  <thead>
                    <tr style="border-top: 2px solid #ddd; border-bottom: 2px solid #ddd;">
                      <th style="padding: 10px; text-align: left;">Produktname</th>
                      <th style="padding: 10px; text-align: right;">Menge</th>
                      <th style="padding: 10px; text-align: right;">Preis</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productRows}
                  </tbody>
                </table>
              </div>
              <div style="margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; margin: 0 auto;">
                  <tbody>
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 10px; text-align: left;"><strong>Trinkgeld</strong></td>
                      <td style="padding: 10px; text-align: right;">${tips.toFixed(2)} €</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 10px; text-align: left;"><strong>Lieferkosten</strong></td>
                      <td style="padding: 10px; text-align: right;">${deliveryFee.toFixed(2)} €</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 10px; text-align: left;"><strong>Gesamtbetrag</strong></td>
                      <td style="padding: 10px; text-align: right;">${totalAmount} €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>Ihre Bestellung wird an die von Ihnen angegebene Adresse geliefert.</p>
              <p>Wir bedanken uns sehr für Ihr Vertrauen in uns.</p>
            </div>
            <div style="padding: 20px 0px 10px 0px; border-radius: 15px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">
              <div style="text-align: center;">
                <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
                <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
                <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
                <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
                <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
                <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
                <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
                <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
                <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
              </div>
              <br>
              <div>
                <p style="text-align: center; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
              </div>
            </div>
          </div>
        </body>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Order confirmation email sent successfully" };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return { success: false, message: "Failed to send order confirmation email" };
  }
};


exports.applyJob = async (jobDetails) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de", // IONOS SMTP server
      port: 465, // Secure SSL port
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: {
        rejectUnauthorized: false, // Bypass SSL issues
      },
    });

    const mailOptions = {
      from: jobDetails.email, // Replace with actual sender email
      // to: `"Frisch für Sie" <info@frischfürsie.in>`,
      from: '"Frisch für Sie" <info@frischfuersie.de>',
      to: "smileyboysuresh33@gmail.com",
      subject: `Apply Job - ${jobDetails.username} `,
      html: `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css"
    integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />

<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; color: #333;">
    <div
        style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
        <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #000;">Bewerbung</h1>
        </div>
        <div style="margin: 20px 0;">
            <p style="font-size: 16px; margin-bottom: 10px;text-align: left;">
                Sehr geehrte Damen und Herren vom Team <strong>Frisch für Sie</strong>,
            </p>
            <p style="font-size: 16px; margin-bottom: 10px;text-align: justify;">
                Ich bin daran interessiert, mich für die Stelle <strong>${jobDetails.username}</strong> in Ihrem
                Unternehmen zu bewerben. Meine Fähigkeiten und Erfahrungen machen mich zu einem guten Kandidaten für
                diese Rolle. Ich freue mich über die Gelegenheit, zu Ihrem Team beizutragen und Ihre Mission zu
                unterstützen.
            </p>
            <p style="font-size: 16px; margin-bottom: 10px;text-align: justify;"> Für weitere Informationen können Sie
                mich gerne unter <strong>${jobDetails.email}</strong> oder <strong>${jobDetails.contact}</strong>
                kontaktieren.
            </p>
            <p style="font-size: 16px; margin-bottom: 10px;text-align: justify;">
                Vielen Dank, dass Sie meine Bewerbung berücksichtigt haben. Ich freue mich auf die Gelegenheit, meine
                Bewerbung ausführlicher zu besprechen.
            </p>
            <p style="font-size: 16px; margin-bottom: 10px;text-align: right;">Mit freundlichen Grüßen,</p>
            <p style="font-size: 16px; margin-bottom: 10px;text-align: right;"><strong>${jobDetails.username}</strong>
            </p>
        </div>
          <div style="padding: 20px 0px 10px 0px; border-radius: 15px; box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;">
<div style="text-align: center;">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
    <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" style="vertical-align: middle;" alt="">
    <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
</div>





    <br>
    <div>
        <p style="text-align: center; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
    </div>
</div>
    </div>
</body>
  `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Job Application sent successfully" };
  } catch (error) {
    console.error("Error sending Job Application email:", error);
    return { success: false, message: "Failed to send Job Application email" };
  }
};


exports.orderDeleteMail = async (userData) => {
  try {
    console.log("User Data:", userData);
    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de",
      port: 465,
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: '"Frisch für Sie" <info@frischfuersie.de>',
      to: userData.email,
      subject: "Ihre Dauerbestellung wurde leider beendet",
      html: `
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; text-align: center; color: #333;">
  <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
    <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px; color: #000;">Frisch für Sie</h1>
    </div><br>

    <p style="font-size: 18px; color: #d9534f; font-weight: bold; text-align: left;">Wir werden Sie vermissen.</p>
    <p style="text-align: left;">Hallo ${userData.username},</p>

    <p style="text-align: justify; font-family: Arial, sans-serif;">
      Wir bestätigen hiermit die Beendigung Ihrer Dauerbestellung. Wir verstehen, dass Sie sich entschieden haben, diesen Service nicht mehr in Anspruch zu nehmen, und wir respektieren Ihre Entscheidung.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif;">
      Wir möchten Ihnen mitteilen, dass wir Sie als regelmäßigen Kunden sehr vermissen werden. Wir schätzen Ihre Treue und die Zeit, die Sie mit uns verbracht haben.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif;">
      Wir haben Ihren Grund für die Beendigung zur Kenntnis genommen und danken Ihnen, dass Sie uns diesen mitgeteilt haben. Wir sind stets bemüht, unser Dienstleistungsangebot zu verbessern, und Ihr Feedback ist uns sehr wichtig.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif;">
      Bitte seien Sie versichert, dass Sie jederzeit wieder herzlich willkommen sind. Es gibt keine Einschränkungen für eine Rückkehr, und wir würden uns freuen, Sie in Zukunft wieder als Kunden begrüßen zu dürfen.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif;">
      Wenn Sie weitere Fragen haben oder wir Ihnen behilflich sein können, zögern Sie bitte nicht, uns zu kontaktieren.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif;">
      Vielen Dank für Ihre Zeit, und wir hoffen, Sie bald wiederzusehen.
    </p>

    <p style="text-align: left; margin-top: 20px; font-family: Arial, sans-serif;">Mit freundlichen Grüßen,<br>Ihr Frisch für Sie Team</p>

    <!-- Social Media Icons -->
    <div style="padding: 20px 0px 10px 0px; font-family: Arial, sans-serif; border-radius: 15px; box-shadow: rgba(0, 0, 0, 0.15) 0px 5px 15px;">
      <div style="text-align: center; font-family: Arial, sans-serif;">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
      </div>
      <br>
      <p style="text-align: center; font-family: Arial, sans-serif; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
    </div>
  </div>
</body>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Cancellation email sent successfully" };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return { success: false, message: "Failed to send cancellation email" };
  }
};

exports.orderDeliveryMail = async (orderData, userData) => { 
  try {
    console.log("User Data:", userData);

    const transporter = nodemailer.createTransport({
      host: "smtp.ionos.de",
      port: 465,
      secure: true,
      auth: {
        user: "info@frischfuersie.de",
        pass: "Gurubaran@12",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: '"Frisch für Sie" <info@frischfuersie.de>',
      to: userData.email,  // ✅ real recipient
      subject: "Lieferung erfolgreich: Ihre süße Bestellung ist angekommen!",
      html: `
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; color: #333;">
  <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
    <div style="background-color: orange; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: #000;">Frisch für Sie</h1>
    </div><br>

    <h2 style="color:#d9534f; text-align:left; margin: 0 0 10px 0;">
      Lieferung erfolgreich: Ihre süße Bestellung ist angekommen!
    </h2>

    <p style="text-align: left; font-family: Arial, sans-serif; font-size: 16px;">Hallo ${userData.username},</p>

    <p style="text-align: justify; font-family: Arial, sans-serif; font-size: 15px;">
      Ihre aktuelle Bestellung bei Frisch für Sie, <strong>${orderData.orderId}</strong>, wurde erfolgreich zugestellt.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif; font-size: 15px;">
      Wir wissen es sehr zu schätzen, dass Sie bei uns eingekauft haben. Jeder Bissen wird mit Liebe und den besten Zutaten zubereitet, und wir freuen uns, dass unsere Leckereien nun bei Ihnen angekommen sind.
    </p>
    <p style="text-align: justify; font-family: Arial, sans-serif; font-size: 15px;">
      Haben Sie Fragen oder Feedback? Sollten Sie Fragen zu Ihrer Bestellung oder anderen Anliegen haben, zögern Sie bitte nicht, auf diese E-Mail zu antworten oder unser Hilfecenter zu besuchen:
      <a href="https://frischfuersie.de/faq" style="color: #007bff; text-decoration: none;">FAQ</a>.
    </p>

    <p style="text-align: left; margin-top: 20px;">Mit süßen Grüßen<br>Ihr Frisch für Sie Team</p>

    <div style="padding: 20px 0 10px 0; border-radius: 15px; box-shadow: rgba(0,0,0,0.15) 0 5px 15px;">
      <div style="text-align: center;">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/gmail.png" alt="Email" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/facebook.png" alt="Facebook" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/instagram.png" alt="Instagram" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/whatsapp.png" alt="Whatsapp" width="30"></a>
        <img src="https://via.placeholder.com/45x1/ffffff/ffffff?text=" width="45" alt="">
        <a href="#"><img src="https://api.frischfuersie.de/uploads/settings/tik-tok.png" alt="Tik Tok" width="30"></a>
      </div>
      <br>
      <p style="text-align: center; font-size: 15px;">&copy; 2025 Frisch für Sie.</p>
    </div>
  </div>
</body>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Delivery email sent successfully" };
  } catch (error) {
    console.error("Error sending delivery email:", error);
    return { success: false, message: "Failed to send delivery email" };
  }
};



// Create and export a function to send subscription order confirmation
// exports.subscriptionOrderConfirm = async (orderData, productDetails, userData) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "rambabu514352@gmail.com",
//         pass: "iqdo bzzj zuwa kctd", // Replace with your secure app password
//       },
//     });

// Dynamically generate rows for product details
//     const productRows = productDetails
//       .map(
//         (product) => `
//         <tr style="border-bottom: 1px solid #eee;">
//           <td style="padding: 10px; text-align: left;">${product[0]}</td>
//           <td style="padding: 10px; text-align: right;">${product[1]}</td>
//         </tr>`
//       )
//       .join("");

//     // Configure the email options with HTML content
//     const mailOptions = {
//       from: '"Frisch für Sie" <info@frischfürsie.in>', // Replace with actual sender email
//       to: userData.email,
//       subject: "Order Confirmation",
//       html: `
//         <body
//     style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; text-align: center; color: #333;">
//     <div
//         style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px;">
//         <div style="background-color: orange; padding: 10px; border-radius: 8px 8px 0 0;">
//             <h1 style="margin: 0; font-size: 30px;">Frisch für Sie</h1>
//         </div>
//         <div style="margin: 20px 0;">
//             <h2 style="color: #007bff; margin-bottom: 10px;">Subscription Order Confirmation</h2>
//             <p>Dear <strong>${{userData.username}}</strong>,</p>
//             <p>Thank you for subscribing to our services! Below are the details of your subscription:</p>

//             <!-- User Details -->
//             <div style="text-align: left; margin-bottom: 20px;">
//                 <p><strong>Name:</strong> ${{userData.username}}</p>
//                 <p><strong>Phone Number:</strong> ${{orderData.contact}}</p>
//                 <p><strong>Address:</strong> ${{orderData.address}}</p>
//             </div>

//             <!-- Subscription Details -->
//             <div style="margin: 20px 0;">
//                 <h3 style="text-align: left; color: #555;">Subscription Details</h3>
//                 <table style="width: 100%; border-collapse: collapse; margin: 0 auto;">
//                     <thead>
//                         <tr style="border-top: 2px solid #ddd; border-bottom: 2px solid #ddd;">
//                             <th style="padding: 10px; text-align: left;">Product Name</th>
//                             <th style="padding: 10px; text-align: right;">Quantity</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         ${{productRows}}
//                     </tbody>
//                 </table>
//             </div>

//             <!-- Payment Details -->
//             <div style="margin: 20px 0;">
//                 <h3 style="text-align: left; color: #555;">Payment Summary</h3>
//                 <table style="width: 100%; border-collapse: collapse; margin: 0 auto;">
//                     <tbody>
//                         <tr style="border-bottom: 1px solid #eee;">
//                             <td style="padding: 10px; text-align: left;"><strong>Tipps</strong></td>
//                             <td style="padding: 10px; text-align: right;">${{orderData.tips}}</td>
//                         </tr>
//                         <tr style="border-bottom: 1px solid #eee;">
//                             <td style="padding: 10px; text-align: left;"><strong>Total Amount</strong></td>
//                             <td style="padding: 10px; text-align: right;">${{userData.deliveryFee}}</td>
//                         </tr>
//                         <tr style="border-bottom: 1px solid #eee;">
//                             <td style="padding: 10px; text-align: left;"><strong>Total Amount</strong></td>
//                             <td style="padding: 10px; text-align: right;">${{orderData.price}}</td>
//                         </tr>
//                     </tbody>
//                 </table>
//             </div>

//             <p>Your subscription services will be delivered regularly as per the schedule. Thank you for choosing Frisch
//                 für Sie!</p>
//         </div>
//         <div style="margin-top: 20px; font-size: 14px; color: #666;">
//             <p>&copy; 2024 Frisch für Sie. All Rights Reserved.</p>
//         </div>
//     </div>
// </body>
//       `,
//     };

//     // Send the email
//     await transporter.sendMail(mailOptions);
//     return { success: true, message: "Order confirmation email sent successfully" };
//   } catch (error) {
//     console.error("Error sending order confirmation email:", error);
//     return { success: false, message: "Failed to send order confirmation email" };
//   }
// };


