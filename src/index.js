const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const mysql = require("mysql2/promise");
const stripe = require('stripe')('sk_test_51QMXiP06yTdeLqihtOQXPLgrFQoPSPYHw4HuNIy90Mx4Tjtlok16xABkl2yntYsZnG4Ycsu74iHcscQysICVbiy00018r2DWnl');
const dbConfig = require('./helpers/db.js')


const db = dbConfig.promise()
const noPromiseDb = dbConfig

const app = express();


const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const __dirname = path.resolve();

// const uploadsDir = path.join(__dirname, 'src/controllers/uploads');
// app.use('/uploads', express.static(uploadsDir));

const uploadsDir = path.join(__dirname, 'src', 'controllers', 'uploads');
app.use('/uploads', express.static(uploadsDir));


app.use('/uploads/settings', express.static(path.join(__dirname, 'src/uploads/settings')));

app.use('/uploads/products', express.static(path.join(__dirname, 'src/uploads/products')));

app.use('/uploads/category', express.static(path.join(__dirname, 'src/uploads/category')));

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Frisch fur sie." });
});

// Routes
app.use("/admin", require("./routes/admin.route.js"));
app.use("/users", require("./routes/users.route.js"));
app.use("/category", require("./routes/category.route.js"));
app.use("/product", require("./routes/product.route.js"));
app.use("/notifications", require("./routes/notification.route.js"));
app.use("/sampleOrder", require("./routes/sampleorder.route.js"));
app.use("/deliveryArea", require("./routes/area.route.js"));
app.use("/userAdv", require("./routes/userAdv.route.js"));
app.use("/jobs", require("./routes/jobs.route.js"));
app.use("/address", require("./routes/address.route.js"));
app.use("/faq", require("./routes/faq.route.js"));
app.use("/coupontype", require("./routes/coupontype.route.js"));
app.use("/coupon", require("./routes/coupon.route.js"));
app.use("/role", require("./routes/role.route.js"));
app.use("/setting", require("./routes/settings.route.js"));
app.use("/impressum", require("./routes/impressum.route.js"));
app.use("/orders", require("./routes/orders.route.js"));
app.use("/cart", require("./routes/card.route.js"));
app.use("/contactUs", require("./routes/contactUs.route.js"));
app.use("/subscribe-orders", require("./routes/subscription.route.js"));
app.use("/all_subscribe-orders", require("./routes/all_subscription.route.js"));







// Generate PDF Route
app.get("/label/pdf", async (req, res) => {
  try {
    // Fetch orders from the database
    const [orders] = await db.query("SELECT * FROM orders");

    const [orders_details] = await db.query("SELECT * FROM orders_details");



    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Labels</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      width: 21cm;
      height: 29.7cm;
      margin: 30mm 45mm 30mm 45mm;
      padding: 0;
      box-sizing: border-box;
    }
    .page {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .cell {
      border: 1px solid #000;
      padding: 10px;
      box-sizing: border-box;
    }
    .content {
      font-size: 14px;
      line-height: 1.5;
    }
    .content strong {
      display: block;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="page">
    ${orders
        .map((order) => {
          const matchingDetails = orders_details.filter(
            (orders_detail) => orders_detail.order_id === order.order_id
          );
          return `
        <div class="cell">
          <div class="content">
            <strong>Order ID:</strong> ${order.order_id}
            ${matchingDetails
              .map(
                (detail) => `
                <strong>Product(s):</strong> ${detail.product_name}
                <strong>Quantity:</strong> ${detail.quantity}
              `
              )
              .join("")}
            <strong>Instruction:</strong> ${order.instruction}
            <strong>Address:</strong> ${order.address}
            <strong>Mobile:</strong> ${order.contact}
          </div>
        </div>
        `;
        })
        .join("")}
  </div>
</body>
</html>
`;

    // Generate and send the PDF
    const pdfPath = path.join(__dirname, "orders.pdf");
    pdf.create(htmlContent, { format: "A4" }).toFile(pdfPath, (err) => {
      if (err) {
        console.error("Error generating PDF:", err);
        return res.status(500).send("Error generating PDF.");
      }

      // Download the PDF and delete it after sending
      res.download(pdfPath, "orders.pdf", (err) => {
        if (err) {
          console.error("Error sending PDF:", err);
        }
        fs.unlinkSync(pdfPath); // Cleanup
      });
    });
  } catch (error) {
    console.error("Error fetching orders or generating PDF:", error);
    res.status(500).send("Error processing your request.");
  }
});

// Start the server
const PORT = 4001;
app.listen(PORT, () => {
  // console.log(Server is running on port ${PORT}.);
});

module.exports = {
  app,
};