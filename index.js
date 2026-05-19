const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const mysql = require("mysql2/promise");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const xlsx = require("xlsx");
const OrdersService = require("./src/services/orders.services.js");
const PDFDocument = require("pdfkit");
const stripe = require('stripe')('sk_test_51QMXiP06yTdeLqihtOQXPLgrFQoPSPYHw4HuNIy90Mx4Tjtlok16xABkl2yntYsZnG4Ycsu74iHcscQysICVbiy00018r2DWnl');
// const stripe = require('stripe')('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');
const orders = require("./src/services/all_subscription.services.js");
const dbConfig = require('./src/helpers/db.js')
const cron = require('node-cron');
const moment = require('moment');
const { orderConfirmMail } = require("./src/helpers/mailServices.js");
const { TimeoutSettings } = require("puppeteer");

const UNZER_PRIVATE_KEY = 's-priv-2a10ptr5q2ZTUdI7aYwJqreRyOyIrnjU'; // Test Key
const UNZER_PRIVATE_KEY_Sepa = 's-priv-2a10NiuHATL9ZqplLwQwInMD0OOrSXKT'; // Test Key
// const UNZER_PRIVATE_KEY = "p-priv-2a10OunrWO1uTONlO7ck7X9ObeZR9by6"; // Live Key

// Change this to "https://frischfuersie.de" when deploying to live
// const FRONTEND_URL = "http://localhost:4200";
const FRONTEND_URL = "https://frischfuersie.de";

const https = require("https");


// const Publishable_Key = "pk_test_TYooMQauvdEDq54NiTphI7jx";
// const Secret_Key = "sk_test_tR3PYbcVNZZ796tH88S4VQ2u:";

// const stripe = require("stripe")(Secret_Key);
// const stripe = require("stripe")("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");
// const YOUR_DOMAIN = "http://localhost:8080";

const app = express();
// const dbConf = require('./src/helpers/db.js')


// Database connection pool
// const db = mysql.createPool({
//   host: "217.154.8.230", 
//   port: 3306, 
//   user: "phpmyadmin",
//   password: "Dortmund@2106",
//   database: "Frisch",
//   // host: "localhost",
//   // user: "root",
//   // password: "",
//   // database: "frisch_2",
//   // port: 3306
// });
const db = dbConfig
const dbPRomise = dbConfig.promise()


// Middleware configurations
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// const __dirname = path.resolve();


// IBAN VALIDATION 

app.post("/validate-iban", (req, res) => {
  const { iban, customerName } = req.body;

  if (!iban || !customerName) {
    return res.status(400).json({ error: "IBAN and customerName are required" });
  }

  const options = {
    method: "GET",
    hostname: "anyapi.io",
    path: `/api/v1/iban?iban=${iban}&apiKey=qpk4nsahhogffaccef0kooq1dlohjeopuq1lp595688u6u570rqio`,
    headers: {}
  };

  const apiReq = https.request(options, (apiRes) => {
    let chunks = [];

    apiRes.on("data", (chunk) => {
      chunks.push(chunk);
    });

    apiRes.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      let result = {};
      try {
        result = JSON.parse(body);
      } catch (err) {
        return res.status(500).json({ error: "Invalid response from AnyAPI" });
      }

      // Include customerName in the response
      res.json({
        customerName,
        iban,
        validation: result
      });
    });
  });
  apiReq.on("error", (e) => {
    res.status(500).json({ error: e.message });
  });

  apiReq.end();
});





app.post('/api/init-payment', async (req, res) => {
  try {
    const { customerData, basketData, returnUrl } = req.body;
    console.log(customerData, "customerData")

    // 1. Create Customer
    const customerRes = await axios.post('https://api.unzer.com/v1/customers', customerData, {
      headers: {
        Authorization: `Basic ${Buffer.from(UNZER_PRIVATE_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      }
    });
    const customerId = customerRes.data.id;

    // 2. Create Basket
    const basketRes = await axios.post('https://api.unzer.com/v1/baskets', basketData, {
      headers: {
        Authorization: `Basic ${Buffer.from(UNZER_PRIVATE_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      }
    });
    const basketId = basketRes.data.id;

    // 3. Create PayPage
    const paypageRes = await axios.post('https://api.unzer.com/v1/paypage/charge', {
      amount: basketData.amountTotalGross,
      currency: basketData.currencyCode,
      returnUrl,
      resources: {
        customerId,
        basketId,
      },
      allowedPaymentMethods: ['card', 'googlepay', 'applepay'],
    }, {
      headers: {
        Authorization: `Basic ${Buffer.from(UNZER_PRIVATE_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      }
    });

    res.json({ payPageId: paypageRes.data.id });

  } catch (err) {
    console.error('Unzer error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Unzer integration failed' });
  }
});

app.get("/api/payment-redirect", async (req, res) => {
  const { orderId, status } = req.query;

  if (status === "cancelled") {
    // Update order status to 'failed' on cancellation
    try {
      await db.promise().query(
        "UPDATE orders SET payment_status = 'failed' WHERE order_id = ?",
        [orderId]
      );
    } catch (err) {
      console.error("Error updating order status for cancellation:", err);
    }
    // Redirect to frontend failure page
    return res.redirect(`${FRONTEND_URL}/unzer-failure?orderId=${orderId}`);
  }

  // Redirect to frontend success page for verification
  return res.redirect(`${FRONTEND_URL}/unzer-success?orderId=${orderId}`);
});

app.post("/api/verify-payment", async (req, res) => {
  const { orderId, paymentId } = req.body;

  if (!paymentId || !orderId) {
    return res.status(400).json({ success: false, msg: "Missing data" });
  }

  try {
    // ✅ 1. Check payment status from Unzer
    const unzerResponse = await axios.get(
      `https://api.unzer.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(UNZER_PRIVATE_KEY + ":").toString("base64"),
        },
      }
    );

    const payment = unzerResponse.data;
    const state = payment.state?.id;
    const status = payment.state?.name;


    // ✅ 2. Get user ID from order
    const [orderRows] = await db
      .promise()
      .query("SELECT user_id FROM orders WHERE order_id = ?", [orderId]);

    if (!orderRows.length) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    const userId = orderRows[0].user_id;

    // ✅ 3. Handle each payment state
    if (state === 1 || status === "completed") {
      // ✅ Update order status
      await db.promise().query(
        "UPDATE orders SET payment_status = 'success', status = 'pending', payment_id = ? WHERE order_id = ?",
        [paymentId, orderId]
      );

      // ✅ Clear user cart
      await db
        .promise()
        .query("DELETE FROM cart WHERE user_id = ?", [userId]);

      console.log(`✅ Order ${orderId} updated & cart cleared`);

      return res.json({ success: true });
    }

    if (state === 0 || status === "pending") {
      await db.promise().query(
        "UPDATE orders SET payment_status = 'pending', payment_id = ? WHERE order_id = ?",
        [paymentId, orderId]
      );

      return res.json({ success: false, msg: "Pending" });
    }

    // ❌ Payment failed
    await db.promise().query(
      "UPDATE orders SET payment_status = 'failed', payment_id = ? WHERE order_id = ?",
      [paymentId, orderId]
    );

    return res.json({ success: false, msg: "Failed" });

  } catch (err) {
    console.error("❌ Verify payment error:", err.response?.data || err);
    return res.status(500).json({
      success: false,
      msg: "Server error verifying payment"
    });
  }
});


app.post("/payment/:amount/:order_id/:user_id", async (req, res) => {
  try {
    const { order_id, user_id } = req.params;
    const { product } = req.body;

    // Validate product amount
    if (!product || !product.amount || isNaN(product.amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "klarna",],
      // payment_method_types: ["card", "apple_pay", "google_pay",  "sepa_debit"],
      line_items: [
        {
          price_data: {
            currency: "EUR", // ✅ Force currency to EUR
            product_data: {
              name: "Order Payment",
            },
            unit_amount: Math.round(product.amount * 100),
          },
          quantity: product.quantity || 1,
        },
      ],
      mode: "payment",
      locale: "de",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["DE"],
      },
      success_url: `https://frischfuersie.de/stripe-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
      cancel_url: `https://frischfuersie.de/stripe-failure?order_id=${order_id}`,
      // success_url: `http://localhost:4200/stripe-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
      // cancel_url: `http://localhost:4200/stripe-failure?order_id=${order_id}`,
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
});
app.post("/paymentSub/:amount/:order_id/:user_id", async (req, res) => {
  try {
    const { order_id, user_id } = req.params;
    const { product } = req.body;

    // Validate product amount
    if (!product || !product.amount || isNaN(product.amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "sepa_debit", "klarna"],
      // payment_method_types: ["card", "apple_pay", "google_pay",  "sepa_debit"],
      line_items: [
        {
          price_data: {
            currency: "EUR", // ✅ Force currency to EUR
            product_data: {
              name: "Order Payment",
            },
            unit_amount: Math.round(product.amount * 100),
          },
          quantity: product.quantity || 1,
        },
      ],
      mode: "payment",
      locale: "de",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["DE"],
      },
      success_url: `https://frischfuersie.de/stripe-Subscription-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
      cancel_url: `https://frischfuersie.de/stripe-failure?order_id=${order_id}`,
      // success_url: `http://localhost:4200/stripe-Subscription-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
      // cancel_url: `http://localhost:4200/stripe-failure?order_id=${order_id}`,
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
});
const axios = require('axios');

app.post('/api/create-paypage', async (req, res) => {
  // try {
  //   const { orderId } = req.body;

  //   // 1. Create customer
  //   const customerRes = await axios.post(
  //     'https://api.unzer.com/v1/customers',
  //     { /* your customer data here */ },
  //     { headers: { Authorization: `Bearer ${UNZER_PRIVATE_KEY}` } }
  //   );

  //   // 2. Create basket
  //   const basketRes = await axios.post(
  //     'https://api.unzer.com/v1/baskets',
  //     { /* your basket data here */ },
  //     { headers: { Authorization: `Bearer ${UNZER_PRIVATE_KEY}` } }
  //   );

  //   // 3. Create paypage
  //   const payPageRes = await axios.post(
  //     'https://api.unzer.com/v1/paypage/charge',
  //     {
  //       amount: '100.00',
  //       currency: 'EUR',
  //       returnUrl: 'https://your-frontend-url.com/payment-result',
  //       orderId: orderId,
  //       resources: {
  //         customerId: customerRes.data.id,
  //         basketId: basketRes.data.id
  //       }
  //     },
  //     { headers: { Authorization: `Bearer ${UNZER_PRIVATE_KEY}` } }
  //   );

  //   return res.json({ payPageId: payPageRes.data.id });

  // } catch (err) {
  //   console.error('Unzer error:', err?.response?.data || err.message);
  //   res.status(500).json({ error: 'Failed to create payment page' });
  // }
});



// app.post("/payment/:amount/:order_id/:user_id", async (req, res) => {
//   try {
//     const { order_id, user_id } = req.params;
//     const { product } = req.body;

//     // Validate product amount
//     if (!product || !product.amount || isNaN(product.amount)) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "EUR",
//             product_data: {
//               name: "Order Payment",
//             },
//             unit_amount: Math.round(product.amount * 100),
//           },
//           quantity: product.quantity || 1,
//         },
//       ],
//       mode: "payment",
//       success_url: `http://localhost:4200/stripe-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
//       cancel_url: `http://localhost:4200/stripe-failure?order_id=${order_id}`,
//     });
//     res.json({id: session.id })

//     const orderSaved = await OrdersService.updatePaymentStatus(order_id, product.details); // Call Order service
//           if (!orderSaved) {
//             return res.status(500).json({ error: "Order creation failed" });
//           }

//   } catch (error) {
//     console.error("Stripe Error:", error);
//     res.status(500).json({ error: "Payment processing failed" });
//   }
// });

app.post("/payment-success-stripe", async (req, res) => {
  try {
    const { order_id, session_id } = req.body;

    // Retrieve payment session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      await OrdersService.updatePaymentStatus(order_id, "success");
      res.json({ message: "Payment successful, order updated." });
    } else {
      res.status(400).json({ error: "Payment not completed." });
    }
  } catch (error) {
    console.error("Error processing payment success:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post('/payment-success', async (req, res) => {
  const { orderId, paymentId } = req.body;

  try {
    // 1. Get payment details from Unzer
    const response = await axios.get(`https://api.unzer.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(UNZER_PRIVATE_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    const payment = response.data;
    const state = payment.state?.id;
    const status = payment.state?.name;

    // 2. Check if payment is successful
    if (status === 'completed') {
      // 3. Update order status
      if (state === 1 || status === "completed") {
        // ✅ Update order status and send confirmation email
        await OrdersService.updatePaymentStatus(orderId, "success", "pending", paymentId);
      }

      return res.json({ success: true, message: 'Unzer payment success confirmed' });
    }

    return res.status(400).json({ success: false, error: 'Payment not completed' });

  } catch (error) {
    console.error('❌ Unzer check error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});


app.post("/payment-failure", async (req, res) => {
  try {
    const { order_id } = req.body;
    await OrdersService.updatePaymentStatus(order_id, "failure");
    res.json({ message: "Payment failed, order status updated." });
  } catch (error) {
    console.error("Error updating failed payment status:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/update-payment-status', async (req, res) => {
  const { order_id, payment_status } = req.body;

  // Save order_id & payment_status to the database
  console.log(`Order ID: ${order_id}, Payment Status: ${payment_status}`);

  res.json({ success: true });
});




app.use(express.json({ limit: '1000mb' })); // Example: 10 MB
app.use(express.urlencoded({ limit: '1000mb', extended: true }));


// Setting up template engine and static directories
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/static", express.static(path.join(__dirname, "public")));
const uploadsDir = path.join(__dirname, 'src/controllers/uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/uploads/settings', express.static(path.join(__dirname, 'src/uploads/settings')));
app.use('/uploads/products', express.static(path.join(__dirname, 'src/uploads/products')));
app.use('/uploads/category', express.static(path.join(__dirname, 'src/uploads/category')));
app.use('/uploads/combo', express.static(path.join(__dirname, 'src/uploads/combo')));

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Frisch fur sie." });
});

app.get("/checkout/:amount/:order_id/:user_id", (req, res) => {
  console.log(req.params)
  res.sendFile(path.join(__dirname, "views", "checkout.html"));
});
app.get("/checkoutSubsciption/:amount/:order_id/:user_id", (req, res) => {
  console.log(req.params)
  res.sendFile(path.join(__dirname, "views", "checkoutSubsciption.html"));
});

app.get("/pay", function (req, res) {

  const currentUser = req.user || null;
  res.render("Home", {
    key: Publishable_Key,
    current_user: currentUser
  });
});

// Fetch and render order labels in EJS template
app.get("/order-report", async (req, res) => {
  try {
    let db = dbPRomise
    const [orders] = await db.query("SELECT * FROM orders WHERE status='Assigned'");
    const [orders_details] = await db.query("SELECT * FROM orders_details");

    const labels = orders.map(order => {
      const matchingDetails = orders_details.filter(detail => detail.order_id === order.order_id);
      const productTable = matchingDetails.length
        ? `
        <table class="label-table">
          <thead>
            <tr>
              <th>Product(s)</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${matchingDetails.map(detail => `
              <tr>
                <td>${detail.product_name}</td>
                <td>${detail.quantity}</td>
              </tr>`).join("")}
          </tbody>
        </table>`
        : `<p>No products available</p>`;

      return `
        <div class="label">
          <div class="label-header">
            <b>Order ID: ${order.order_id}</b>
          </div>
          <div class="label-details">
            ${productTable}
            <p><strong>Instruction:</strong> ${order.instruction || "None"}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            <p><strong>Mobile:</strong> ${order.contact}</p>
          </div>
        </div>`;
    }).join("");

    res.render("label.ejs", { labels });
  } catch (error) {
    console.error("Error processing your request:", error);
    res.status(500).send("Error processing your request.");
  }
});



// app.get("/label/excel", (req, res) => {
//   try {
//     let pool = db;
//     const data = JSON.parse(req.query.data);
//     const orders = data;

//     pool.query("SELECT * FROM orders_details", (err, orders_details_result) => {
//       if (err) return res.status(500).send("Error fetching order details");

//       const orders_details = orders_details_result;
//       const userIds = [...new Set(orders.map(order => order.user_id))];

//       pool.query("SELECT id, fname, lname FROM users WHERE id IN (?)", [userIds], (err, users_result) => {
//         if (err) return res.status(500).send("Error fetching user info");

//         const users = users_result;
//         const usersMap = users.reduce((acc, user) => {
//           acc[user.id] = { fname: user.fname, lname: user.lname };
//           return acc;
//         }, {});

//         const productNames = [...new Set(orders_details.map(detail => detail.product_name))];

//         pool.query("SELECT product_name, nickname FROM product WHERE product_name IN (?)", [productNames], (err, products_result) => {
//           if (err) return res.status(500).send("Error fetching products");

//           const products = products_result;
//           const productNicknames = products.reduce((acc, product) => {
//             acc[product.product_name] = product.nickname || product.product_name;
//             return acc;
//           }, {});

//           const doc = new PDFDocument({
//             size: "A4",
//             margins: { top: 62, bottom: 62, left: 0, right: 0 },
//           });

//           const pdfPath = path.join(__dirname, "labels.pdf");
//           const stream = fs.createWriteStream(pdfPath);
//           doc.pipe(stream);

//           const labelWidth = 198;
//           const labelHeight = 144;
//           const gapX = 10, gapY = 10;
//           const maxLabelsPerRow = 3;
//           const maxRowsPerPage = 5;
//           let x = 0, y = 62;
//           let labelCount = 0;
//           let serialNumber = 1; // One serial number per order

//           orders.forEach((order) => {
//             const matchingDetails = orders_details.filter(detail => detail.order_id === order.order_id);
//             const user = usersMap[order.user_id] || { fname: "", lname: "" };
//             const instruction = order.instruction || "";

//             const productChunks = [];
//             for (let i = 0; i < matchingDetails.length; i += 9) {
//               productChunks.push(matchingDetails.slice(i, i + 9));
//             }

//             productChunks.forEach((productGroup) => {
//               const productList = productGroup.map(detail => `${detail.quantity} ${productNicknames[detail.product_name]} `);
//               const formattedProducts = productList.join(", ");

//               const circleRadius = 8;
//               doc.circle(x + labelWidth - circleRadius - 26, y + circleRadius + 5, circleRadius).stroke();
//               doc.font("Helvetica-Bold").fontSize(12).text(
//                 `${serialNumber}`,
//                 x + labelWidth - circleRadius - 30,
//                 y + 8,
//                 { width: circleRadius * 1, align: "center" }
//               );

//               doc.font("Helvetica-Bold").fontSize(10).text(
//                 `${capitalize(user.lname)} ${capitalize(user.fname)}`,
//                 x + 5, y + 5,
//                 { width: labelWidth - 12 }
//               );
//               doc.font("Helvetica").fontSize(10).text(
//                 `${order.address || "Unknown Address"}`,
//                 x + 5, y + 25,
//                 { width: labelWidth - 10 }
//               );
//               doc.font("Helvetica").fontSize(10).text(
//                 `${formattedProducts}`,
//                 x + 5, y + 65,
//                 { width: labelWidth - 10 }
//               );
//               doc.font("Helvetica").fontSize(8).text(
//                 `${instruction}`,
//                 x + 5, y + 120,
//                 { width: labelWidth - 10 }
//               );

//               labelCount++;
//               if (labelCount % maxLabelsPerRow === 0) {
//                 x = 0;
//                 y += labelHeight + gapY;
//               } else {
//                 x += labelWidth + gapX;
//               }
//               if (labelCount % (maxLabelsPerRow * maxRowsPerPage) === 0) {
//                 doc.addPage();
//                 x = 0;
//                 y = 62;
//               }
//             });

//             serialNumber++; // Increment serial number after all labels of this order
//           });

//           doc.end();
//           stream.on("finish", () => {
//             res.download(pdfPath, "labels.pdf", (err) => {
//               if (err) console.error("Error sending PDF file:", err);
//               fs.unlinkSync(pdfPath);
//             });
//           });
//         });
//       });
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Error generating PDF labels.");
//   }
// });

app.post("/label/excel", (req, res) => {
  try {
    let pool = db;

    // ⬅⬅⬅ FIXED: Get data from body, not query
    const data = req.body;
    const orders = data;

    pool.query("SELECT * FROM orders_details", (err, orders_details_result) => {
      if (err) return res.status(500).send("Error fetching order details");

      const orders_details = orders_details_result;
      const userIds = [...new Set(orders.map(order => order.user_id))];

      pool.query("SELECT id, fname, lname FROM users WHERE id IN (?)", [userIds], (err, users_result) => {
        if (err) return res.status(500).send("Error fetching user info");

        const users = users_result;
        const usersMap = users.reduce((acc, user) => {
          acc[user.id] = { fname: user.fname, lname: user.lname };
          return acc;
        }, {});

        const productNames = [...new Set(orders_details.map(detail => detail.product_name))];

        pool.query("SELECT product_name, nickname FROM product WHERE product_name IN (?)", [productNames], (err, products_result) => {
          if (err) return res.status(500).send("Error fetching products");

          const products = products_result;
          const productNicknames = products.reduce((acc, product) => {
            acc[product.product_name] = product.nickname || product.product_name;
            return acc;
          }, {});

          const doc = new PDFDocument({
            size: "A4",
            margins: { top: 62, bottom: 62, left: 0, right: 0 },
          });

          const pdfPath = path.join(__dirname, "labels.pdf");
          const stream = fs.createWriteStream(pdfPath);
          doc.pipe(stream);

          const labelWidth = 198;
          const labelHeight = 144;
          const gapX = 10, gapY = 10;
          const maxLabelsPerRow = 3;
          const maxRowsPerPage = 5;
          let x = 0, y = 62;
          let labelCount = 0;
          let serialNumber = 1;

          orders.forEach((order) => {
            const matchingDetails = orders_details.filter(detail => detail.order_id === order.order_id);
            const user = usersMap[order.user_id] || { fname: "", lname: "" };
            const instruction = order.instruction || "";

            const productChunks = [];
            for (let i = 0; i < matchingDetails.length; i += 9) {
              productChunks.push(matchingDetails.slice(i, i + 9));
            }

            productChunks.forEach((productGroup) => {
              const productList = productGroup.map(detail => `${detail.quantity} ${productNicknames[detail.product_name]} `);
              const formattedProducts = productList.join(", ");

              const circleRadius = 8;
              doc.circle(x + labelWidth - circleRadius - 26, y + circleRadius + 5, circleRadius).stroke();
              doc.font("Helvetica-Bold").fontSize(12).text(
                `${serialNumber}`,
                x + labelWidth - circleRadius - 30,
                y + 8,
                { width: circleRadius * 1, align: "center" }
              );

              doc.font("Helvetica-Bold").fontSize(10).text(
                `${capitalize(user.lname)} ${capitalize(user.fname)}`,
                x + 5, y + 5,
                { width: labelWidth - 12 }
              );
              doc.font("Helvetica").fontSize(10).text(
                `${order.address || "Unknown Address"}`,
                x + 5, y + 25,
                { width: labelWidth - 10 }
              );
              doc.font("Helvetica").fontSize(10).text(
                `${formattedProducts}`,
                x + 5, y + 65,
                { width: labelWidth - 10 }
              );
              doc.font("Helvetica").fontSize(8).text(
                `${instruction}`,
                x + 5, y + 120,
                { width: labelWidth - 10 }
              );

              labelCount++;
              if (labelCount % maxLabelsPerRow === 0) {
                x = 0;
                y += labelHeight + gapY;
              } else {
                x += labelWidth + gapX;
              }
              if (labelCount % (maxLabelsPerRow * maxRowsPerPage) === 0) {
                doc.addPage();
                x = 0;
                y = 62;
              }
            });

            serialNumber++;
          });

          doc.end();
          stream.on("finish", () => {
            res.download(pdfPath, "labels.pdf", (err) => {
              if (err) console.error("Error sending PDF file:", err);
              fs.unlinkSync(pdfPath);
            });
          });
        });
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error generating PDF labels.");
  }
});




function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


let authHeader = {
  Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
  "Content-Type": "application/json",
};
// cron.schedule('* * * * *',  // every minute (for testing)
// cron.schedule("0 10 2 * *",
//    async () => {
//   console.log("🔁 Monthly Unzer SEPA Billing Cron Triggered");

//   if (!db || !db.promise || typeof moment !== "function") {
//     console.error("❌ Database connection or moment.js not initialized");
//     return;
//   }

//   try {
//     // Step 1: Get subscription totals per user for last month
//     const [subscriptions] = await db.promise().query(`
//       SELECT user_id, SUM(price) AS total_price, SUM(tips) AS total_tips
//       FROM subscription
//       WHERE MONTH(delivery_date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
//         AND YEAR(delivery_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)
//         AND status = 'completed'
//       GROUP BY user_id
//     `);

//     for (const sub of subscriptions) {
//       const user_id = sub.user_id;
//       const total_amount = parseFloat(
//         (parseFloat(sub.total_price || 0) + parseFloat(sub.total_tips || 0)).toFixed(2)
//       );

//       try {
//         // Step 2: Get user data
//         const [userRows] = await db.promise().query(
//           "SELECT username, email, ban_no FROM users WHERE id = ?",
//           [user_id]
//         );

//         if (!userRows || userRows.length === 0) throw new Error("User not found");
//         const user = userRows[0];

//         if (!user.ban_no) {
//           console.warn(`⚠️ Skipping user ${user_id}: IBAN not found`);
//           await db.promise().query(
//             `INSERT INTO subscription_transactions 
//               (user_id, username, amount, payment_id, status, billing_month, error_message) 
//              VALUES (?, ?, ?, ?, ?, ?, ?)`,
//             [
//               user_id,
//               user.username || "Unknown",
//               total_amount,
//               null,
//               "failed",
//               moment().subtract(1, "month").format("YYYY-MM"),
//               "IBAN not found",
//             ]
//           );
//           continue;
//         }

//         // Step 3: Create Unzer Customer
//         const customerRes = await axios.post(
//           "https://api.unzer.com/v1/customers",
//           {
//             firstname: user.username || "Test",
//             lastname: "Customer",
//             email: user.email || `user${user_id}@example.com`,
//           },
//           { headers: authHeader }
//         );
//         const customerId = customerRes.data.id;

//         // Step 4: Create SEPA payment type
//         const sepaRes = await axios.post(
//           "https://api.unzer.com/v1/types/sepa-direct-debit",
//           {
//             iban: user.ban_no,
//             holder: user.username || "Test Holder",
//           },
//           { headers: authHeader }
//         );
//         const paymentTypeId = sepaRes.data.id;

//         // Step 5: Charge (with correct payload)
//         const chargePayload = {
//           amount: total_amount,
//           currency: "EUR",
//           orderId: `SUBS-${user_id}-${moment().format("YYYYMM")}`,
//           resources: {
//             typeId: paymentTypeId,
//             customerId: customerId
//           },
//           additionalTransactionData: {
//             sepaDirectDebit: {
//               recurrenceType: "scheduled",
//             },
//           },
//         };
//         console.log("Unzer Charge Payload:", chargePayload);

//         const payRes = await axios.post(
//           "https://api.unzer.com/v1/payments/charges",
//           chargePayload,
//           { headers: authHeader }
//         );

//         const paymentId = payRes.data.id;
//         const status = payRes.data.processing?.result?.description || "success";

//         console.log(`✅ Payment Success: ${paymentId} | Status: ${status}`);

//         // Step 6: Save SUCCESS transaction
//         await db.promise().query(
//           `INSERT INTO subscription_transactions 
//             (user_id, username, amount, payment_id, status, billing_month, error_message) 
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             user_id,
//             user.username,
//             total_amount,
//             paymentId,
//             "success",
//             moment().subtract(1, "month").format("YYYY-MM"),
//             null,
//           ]
//         );
//       } catch (innerErr) {
//         // Log Unzer API error details and save failure
//         let errorMsg = innerErr.response?.data
//           ? JSON.stringify(innerErr.response.data.errors || innerErr.response.data)
//           : innerErr.message;
//         let customerMsg = innerErr.response?.data?.customerMessage || "Unknown User";
//         console.error("❌ Payment Failed:", errorMsg);

//         await db.promise().query(
//           `INSERT INTO subscription_transactions 
//             (user_id, username, amount, payment_id, status, billing_month, error_message) 
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             user_id,
//             customerMsg,
//             total_amount,
//             null,
//             "failed",
//             moment().subtract(1, "month").format("YYYY-MM"),
//             errorMsg,
//           ]
//         );
//       }
//     }
//   } catch (err) {
//     console.error("❌ Unzer Billing Error:", err.message || err);
//   }
// });

// every minute (for testing)
// cron.schedule("0 10 2 * *",
//    async () => {
//   console.log("🔁 Monthly Subscription Billing Cron Triggered");

//   if (!db || !db.promise || typeof moment !== "function") {
//     console.error("❌ Database connection or moment.js not initialized");
//     return;
//   }

//   try {
//     // 1. Get subscription totals per user for last month
//     const [subscriptions] = await db.promise().query(`
//       SELECT s.user_id, s.paymentType, SUM(s.price) AS total_price, SUM(s.tips) AS total_tips,
//              u.username, u.email, u.ban_no, u.paypal_payment_id, u.paypal_type_id
//       FROM subscription s
//       JOIN users u ON u.id = s.user_id
//       WHERE MONTH(s.delivery_date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
//         AND YEAR(s.delivery_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)
//         AND s.status = 'completed'
//       GROUP BY s.user_id
//     `);

//     for (const sub of subscriptions) {
//       const user_id = sub.user_id;
//       const total_amount = parseFloat(
//         (parseFloat(sub.total_price || 0) + parseFloat(sub.total_tips || 0)).toFixed(2)
//       );

//       try {
//        if ((sub.paymentType || "").toUpperCase() === "SEPA") {
//           // ---- SEPA Flow ----
//           if (!sub.ban_no) {
//             console.warn(`⚠️ Skipping SEPA user ${user_id}: IBAN not found`);
//             await db.promise().query(
//               `INSERT INTO subscription_transactions 
//                 (user_id, username, amount, payment_id, status, billing_month, error_message) 
//                VALUES (?, ?, ?, ?, ?, ?, ?)`,
//               [
//                 user_id,
//                 sub.username || "Unknown",
//                 total_amount,
//                 null,
//                 "failed",
//                 moment().subtract(1, "month").format("YYYY-MM"),
//                 "IBAN not found",
//               ]
//             );
//             continue;
//           }

//           // Create Unzer customer
//           const customerRes = await axios.post(
//             "https://api.unzer.com/v1/customers",
//             {
//               firstname: sub.username || "Test",
//               lastname: "Customer",
//               email: sub.email || `user${user_id}@example.com`,
//             },
//             { headers: authHeader }
//           );
//           const customerId = customerRes.data.id;

//           // Create SEPA payment type
//           const sepaRes = await axios.post(
//             "https://api.unzer.com/v1/types/sepa-direct-debit",
//             {
//               iban: sub.ban_no,
//               holder: sub.username || "Test Holder",
//             },
//             { headers: authHeader }
//           );
//           const paymentTypeId = sepaRes.data.id;

//           // Charge SEPA
//           const chargePayload = {
//             amount: total_amount,
//             currency: "EUR",
//             orderId: `SUBS-SEPA-${user_id}-${moment().format("YYYYMM")}`,
//             resources: {
//               typeId: paymentTypeId,
//               customerId: customerId,
//             },
//             additionalTransactionData: { sepaDirectDebit: { recurrenceType: "scheduled" } },
//           };

//           const payRes = await axios.post(
//             "https://api.unzer.com/v1/payments/charges",
//             chargePayload,
//             { headers: authHeader }
//           );

//           const paymentId = payRes.data.id;
//           const status = payRes.data.processing?.result?.description || "success";

//           console.log(`✅ SEPA Payment Success: ${paymentId} | Status: ${status}`);

//           await db.promise().query(
//             `INSERT INTO subscription_transactions 
//               (user_id, username, amount, payment_id, status, billing_month, error_message) 
//              VALUES (?, ?, ?, ?, ?, ?, ?)`,
//             [
//               user_id,
//               sub.username,
//               total_amount,
//               paymentId,
//               "success",
//               moment().subtract(1, "month").format("YYYY-MM"),
//               null,
//             ]
//           );
// } else if ((sub.paymentType || "").toUpperCase() === "PAYPAL") {
//   // ---- PayPal Recurring Billing via Unzer ----
//   if (!sub.paypal_payment_id || !sub.paypal_type_id) {
//     console.warn(`⚠️ Skipping PayPal user ${user_id}: missing paymentId/typeId`);

//     await db.promise().query(
//       `INSERT INTO subscription_transactions 
//         (user_id, username, amount, payment_id, status, billing_month, error_message) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         sub.username || "Unknown",
//         total_amount,
//         null,
//         "failed",
//         moment().subtract(1, "month").format("YYYY-MM"),
//         "PayPal paymentId/typeId missing",
//       ]
//     );
//     continue;
//   }

//   try {
//     const chargeRes = await axios.post(
//       "https://api.unzer.com/v1/payments/charges",
//       {
//         amount: total_amount,                     // ✅ monthly subscription amount
//         currency: sub.currency || "EUR",
//         resources: {
//           typeId: sub.paypal_payment_id,             // ✅ stored billing agreement (s-ppl-xxxx)
//         },
//         paymentReference: `SUBS-PAYPAL-${user_id}-${moment().format("YYYYMM")}`, // ✅ clear reference
//         returnUrl: "https://frischfuersie.de/paypal-subscription-success"  // ✅ REQUIRED
//       },
//       {
//         headers: {
//           Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     console.log(`✅ PayPal Charge Success: User ${user_id}, Amount ${total_amount} EUR`);
//     console.log("Unzer Response:", chargeRes.data);

//     // ✅ Log transaction in DB
//     await db.promise().query(
//       `INSERT INTO subscription_transactions 
//         (user_id, username, amount, payment_id, status, billing_month, error_message) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         sub.username,
//         total_amount,
//         chargeRes.data.id || sub.paypal_payment_id, // ✅ use Unzer charge id
//         "success",
//         moment().subtract(1, "month").format("YYYY-MM"),
//         null,
//       ]
//     );

//     // ✅ Optional: save full API response for auditing
//     // await db.savePaymentLog(user_id, chargeRes.data);

//   } catch (err) {
//     console.error(`❌ PayPal Charge Failed: User ${user_id}`, err.response?.data || err.message);

//     await db.promise().query(
//       `INSERT INTO subscription_transactions 
//         (user_id, username, amount, payment_id, status, billing_month, error_message) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         sub.username,
//         total_amount,
//         sub.paypal_payment_id || null,
//         "failed",
//         moment().subtract(1, "month").format("YYYY-MM"),
//         err.response?.data?.errors?.[0]?.customerMessage || err.message
//       ]
//     );
//   }
// }

//       } catch (innerErr) {
//         let errorMsg = innerErr.response?.data
//           ? JSON.stringify(innerErr.response.data.errors || innerErr.response.data)
//           : innerErr.message;

//         await db.promise().query(
//           `INSERT INTO subscription_transactions 
//             (user_id, username, amount, payment_id, status, billing_month, error_message) 
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             user_id,
//             sub.username || "Unknown",
//             total_amount,
//             null,
//             "failed",
//             moment().subtract(1, "month").format("YYYY-MM"),
//             errorMsg,
//           ]
//         );
//       }
//     }
//   } catch (err) {
//     console.error("❌ Subscription Billing Cron Error:", err.message || err);
//   }
// });

// cron.schedule('* * * * *',  // every minute (for testing)
cron.schedule("0 10 2 * *",
  async () => {
    console.log("🔁 Monthly Subscription Billing Cron Triggered");

    if (!db || !db.promise || typeof moment !== "function") {
      console.error("❌ Database connection or moment.js not initialized");
      return;
    }

    try {
      // 1. Get subscription totals per user for last month
      const [subscriptions] = await db.promise().query(`
      SELECT s.user_id, s.paymentType, SUM(s.price) AS total_price, SUM(s.tips) AS total_tips,
      SUM(s.deliveryFee) AS deliveryFee,
             u.username, u.email, u.ban_no, u.paypal_payment_id, u.paypal_type_id
      FROM subscription s
      JOIN users u ON u.id = s.user_id
      WHERE MONTH(s.delivery_date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
        AND YEAR(s.delivery_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)
        AND s.status = 'completed'
      GROUP BY s.user_id
    `);

      for (const sub of subscriptions) {
        const user_id = sub.user_id;
        const total_amount = parseFloat(
          (parseFloat(sub.total_price || 0) + parseFloat(sub.total_tips || 0) + parseFloat(sub.deliveryFee || 0)).toFixed(2)
        );

        try {
          if ((sub.paymentType || "").toUpperCase() === "SEPA") {
            // ---- SEPA Flow ----
            if (!sub.ban_no) {
              console.warn(`⚠️ Skipping SEPA user ${user_id}: IBAN not found`);
              await db.promise().query(
                `INSERT INTO subscription_transactions 
                (user_id, username, amount, payment_id, status, billing_month, error_message) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  user_id,
                  sub.username || "Unknown",
                  total_amount,
                  null,
                  "failed",
                  moment().subtract(1, "month").format("YYYY-MM"),
                  "IBAN not found",
                ]
              );
              continue;
            }

            // Create Unzer customer
            const customerRes = await axios.post(
              "https://api.unzer.com/v1/customers",
              {
                firstname: sub.username || "Test",
                lastname: "Customer",
                email: sub.email || `user${user_id}@example.com`,
              },
              { headers: authHeader }
            );
            const customerId = customerRes.data.id;

            // Create SEPA payment type
            const sepaRes = await axios.post(
              "https://api.unzer.com/v1/types/sepa-direct-debit",
              {
                iban: sub.ban_no,
                holder: sub.username || "Test Holder",
              },
              { headers: authHeader }
            );
            const paymentTypeId = sepaRes.data.id;

            // Charge SEPA
            const chargePayload = {
              amount: total_amount,
              currency: "EUR",   // ✅ Hardcoded to EUR
              orderId: `SUBS-SEPA-${user_id}-${moment().format("YYYYMM")}`,
              resources: {
                typeId: paymentTypeId,
                customerId: customerId,
              },
              additionalTransactionData: { sepaDirectDebit: { recurrenceType: "scheduled" } },
            };

            const payRes = await axios.post(
              "https://api.unzer.com/v1/payments/charges",
              chargePayload,
              { headers: authHeader }
            );

            const paymentId = payRes.data.id;
            const status = payRes.data.processing?.result?.description || "success";

            console.log(`✅ SEPA Payment Success: ${paymentId} | Status: ${status}`);

            await db.promise().query(
              `INSERT INTO subscription_transactions 
              (user_id, username, amount, payment_id, status, billing_month, error_message) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                user_id,
                sub.username,
                total_amount,
                paymentId,
                "success",
                moment().subtract(1, "month").format("YYYY-MM"),
                null,
              ]
            );
          } else if ((sub.paymentType || "").toUpperCase() === "PAYPAL") {
            // ---- PayPal Recurring Billing via Unzer ----
            if (!sub.paypal_payment_id || !sub.paypal_type_id) {
              console.warn(`⚠️ Skipping PayPal user ${user_id}: missing paymentId/typeId`);

              await db.promise().query(
                `INSERT INTO subscription_transactions 
        (user_id, username, amount, payment_id, status, billing_month, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  user_id,
                  sub.username || "Unknown",
                  total_amount,
                  null,
                  "failed",
                  moment().subtract(1, "month").format("YYYY-MM"),
                  "PayPal paymentId/typeId missing",
                ]
              );
              continue;
            }

            try {
              const chargeRes = await axios.post(
                "https://api.unzer.com/v1/payments/charges",
                {
                  amount: total_amount,                     // ✅ monthly subscription amount
                  currency: "EUR",                           // ✅ Fixed hardcoded currency
                  resources: {
                    typeId: sub.paypal_payment_id,           // ✅ stored billing agreement (s-ppl-xxxx)
                  },
                  paymentReference: `SUBS-PAYPAL-${user_id}-${moment().format("YYYYMM")}`, // ✅ clear reference
                  returnUrl: "https://frischfuersie.de/paypal-subscription-success"  // ✅ REQUIRED
                },
                {
                  headers: {
                    Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
                    "Content-Type": "application/json"
                  }
                }
              );

              console.log(`✅ PayPal Charge Success: User ${user_id}, Amount ${total_amount} EUR`);
              console.log("Unzer Response:", chargeRes.data);

              // ✅ Log transaction in DB
              await db.promise().query(
                `INSERT INTO subscription_transactions 
        (user_id, username, amount, payment_id, status, billing_month, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  user_id,
                  sub.username,
                  total_amount,
                  chargeRes.data.id || sub.paypal_payment_id, // ✅ use Unzer charge id
                  "success",
                  moment().subtract(1, "month").format("YYYY-MM"),
                  null,
                ]
              );

            } catch (err) {
              console.error(`❌ PayPal Charge Failed: User ${user_id}`, err.response?.data || err.message);

              await db.promise().query(
                `INSERT INTO subscription_transactions 
        (user_id, username, amount, payment_id, status, billing_month, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  user_id,
                  sub.username,
                  total_amount,
                  sub.paypal_payment_id || null,
                  "failed",
                  moment().subtract(1, "month").format("YYYY-MM"),
                  err.response?.data?.errors?.[0]?.customerMessage || err.message
                ]
              );
            }
          }

        } catch (innerErr) {
          let errorMsg = innerErr.response?.data
            ? JSON.stringify(innerErr.response.data.errors || innerErr.response.data)
            : innerErr.message;

          await db.promise().query(
            `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              user_id,
              sub.username || "Unknown",
              total_amount,
              null,
              "failed",
              moment().subtract(1, "month").format("YYYY-MM"),
              errorMsg,
            ]
          );
        }
      }
    } catch (err) {
      console.error("❌ Subscription Billing Cron Error:", err.message || err);
    }
  });

// manual triger monthly billingMonth

app.post("/processUserBilling", async (req, res) => {
  const { user_id, billingMonth } = req.body; // 👈 coming from frontend

  try {
    const [subs] = await db.promise().query(
      `
      SELECT s.user_id, s.paymentType, SUM(s.price) AS total_price, SUM(s.tips) AS total_tips,
             u.username, u.email, u.ban_no, u.paypal_payment_id, u.paypal_type_id
      FROM subscription s
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id = ?
        AND DATE_FORMAT(s.delivery_date, '%Y-%m') = ?
        AND s.status = 'completed'
      GROUP BY s.user_id
    `,
      [user_id, billingMonth]
    );

    if (!subs || subs.length === 0) {
      return res.status(404).json({ error: `No subscriptions found for user ${user_id} in ${billingMonth}` });
    }

    const sub = subs[0];
    const total_amount = parseFloat(
      (parseFloat(sub.total_price || 0) + parseFloat(sub.total_tips || 0)).toFixed(2)
    );

    // ================= SEPA FLOW =================
    if ((sub.paymentType || "").toUpperCase() === "SEPA") {
      if (!sub.ban_no) {
        console.warn(`⚠️ Skipping SEPA user ${user_id}: IBAN not found`);
        await db.promise().query(
          `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            sub.username || "Unknown",
            total_amount,
            null,
            "failed",
            billingMonth,
            "IBAN not found",
          ]
        );
        return res.json({ success: false, error: "IBAN not found" });
      }

      try {
        // Create Unzer customer
        const customerRes = await axios.post(
          "https://api.unzer.com/v1/customers",
          {
            firstname: sub.username || "Test",
            lastname: "Customer",
            email: sub.email || `user${user_id}@example.com`,
          },
          { headers: authHeader }
        );
        const customerId = customerRes.data.id;

        // Create SEPA payment type
        const sepaRes = await axios.post(
          "https://api.unzer.com/v1/types/sepa-direct-debit",
          {
            iban: sub.ban_no,
            holder: sub.username || "Test Holder",
          },
          { headers: authHeader }
        );
        const paymentTypeId = sepaRes.data.id;

        // Charge SEPA
        const chargePayload = {
          amount: total_amount,
          currency: "EUR",
          orderId: `SUBS-SEPA-${user_id}-${billingMonth}`,
          resources: {
            typeId: paymentTypeId,
            customerId: customerId,
          },
          additionalTransactionData: { sepaDirectDebit: { recurrenceType: "scheduled" } },
        };

        const payRes = await axios.post(
          "https://api.unzer.com/v1/payments/charges",
          chargePayload,
          { headers: authHeader }
        );

        const paymentId = payRes.data.id;
        const status = payRes.data.processing?.result?.description || "success";

        console.log(`✅ SEPA Payment Success: ${paymentId} | Status: ${status}`);

        await db.promise().query(
          `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            sub.username,
            total_amount,
            paymentId,
            "success",
            billingMonth,
            null,
          ]
        );

        return res.json({ success: true, method: "SEPA", user_id, billingMonth, total_amount });
      } catch (err) {
        console.error(`❌ SEPA Charge Failed: User ${user_id}`, err.response?.data || err.message);

        await db.promise().query(
          `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            sub.username,
            total_amount,
            null,
            "failed",
            billingMonth,
            err.response?.data?.errors?.[0]?.customerMessage || err.message,
          ]
        );

        return res.status(500).json({ success: false, error: "SEPA Payment Failed" });
      }
    }

    // ================= PAYPAL FLOW =================
    else if ((sub.paymentType || "").toUpperCase() === "PAYPAL") {
      if (!sub.paypal_payment_id || !sub.paypal_type_id) {
        console.warn(`⚠️ Skipping PayPal user ${user_id}: missing paymentId/typeId`);

        await db.promise().query(
          `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            sub.username || "Unknown",
            total_amount,
            null,
            "failed",
            billingMonth,
            "PayPal paymentId/typeId missing",
          ]
        );
        return res.json({ success: false, error: "PayPal paymentId/typeId missing" });
      }

      try {
        const chargeRes = await axios.post(
          "https://api.unzer.com/v1/payments/charges",
          {
            amount: total_amount,
            currency: "EUR",
            resources: {
              typeId: sub.paypal_payment_id, // stored billing agreement
            },
            paymentReference: `SUBS-PAYPAL-${user_id}-${billingMonth}`,
            returnUrl: "https://frischfuersie.de/paypal-subscription-success"
          },
          { headers: authHeader }
        );

        console.log(`✅ PayPal Charge Success: User ${user_id}, Amount ${total_amount} EUR`);

        await db.promise().query(
          `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            sub.username,
            total_amount,
            chargeRes.data.id || sub.paypal_payment_id,
            "success",
            billingMonth,
            null,
          ]
        );

        return res.json({ success: true, method: "PAYPAL", user_id, billingMonth, total_amount });
      } catch (err) {
        console.error(`❌ PayPal Charge Failed: User ${user_id}`, err.response?.data || err.message);

        await db.promise().query(
          `INSERT INTO subscription_transactions 
            (user_id, username, amount, payment_id, status, billing_month, error_message) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            sub.username,
            total_amount,
            sub.paypal_payment_id || null,
            "failed",
            billingMonth,
            err.response?.data?.errors?.[0]?.customerMessage || err.message,
          ]
        );

        return res.status(500).json({ success: false, error: "PayPal Payment Failed" });
      }
    }

    // ================= UNKNOWN PAYMENT TYPE =================
    else {
      return res.status(400).json({ error: `Unsupported paymentType: ${sub.paymentType}` });
    }
  } catch (err) {
    console.error("❌ Billing error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});


// test only paypal subscription creation
app.post("/testPayPalCharge", async (req, res) => {
  const { user_id, paypal_payment_id, paypal_type_id, amount } = req.body;

  if (!user_id || !paypal_payment_id || !paypal_type_id || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Build Unzer charge request
    const chargePayload = {
      amount: parseFloat(amount).toFixed(2),
      currency: "EUR",
      resources: {
        typeId: paypal_payment_id, // stored billing agreement (s-ppl-xxxx)
      },
      paymentReference: `TEST-PAYPAL-${user_id}-${Date.now()}`,
      returnUrl: "https://frischfuersie.de/paypal-subscription-success", // must exist
    };

    const chargeRes = await axios.post(
      "https://api.unzer.com/v1/payments/charges",
      chargePayload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Log into DB (optional)
    await db.promise().query(
      `INSERT INTO subscription_transactions 
        (user_id, username, amount, payment_id, status, billing_month, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        `TEST-USER-${user_id}`,
        amount,
        chargeRes.data.id || paypal_payment_id,
        "success",
        moment().format("YYYY-MM"),
        null,
      ]
    );

    console.log(`✅ PayPal Test Charge Success: ${chargeRes.data.id}`);

    return res.json({
      success: true,
      user_id,
      amount,
      charge_id: chargeRes.data.id,
      status: chargeRes.data.processing?.result?.description || "success",
    });
  } catch (err) {
    console.error("❌ PayPal Test Charge Failed:", err.response?.data || err.message);

    // Log failure
    await db.promise().query(
      `INSERT INTO subscription_transactions 
        (user_id, username, amount, payment_id, status, billing_month, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        `TEST-USER-${user_id}`,
        amount,
        paypal_payment_id || null,
        "failed",
        moment().format("YYYY-MM"),
        err.response?.data?.errors?.[0]?.customerMessage || err.message,
      ]
    );

    return res.status(500).json({
      success: false,
      error: err.response?.data?.errors?.[0]?.customerMessage || err.message,
    });
  }
});







// // app.post("/test-unzer-sepa-charge", async (req, res) => {
// //   const { user_id, username, email, iban, amount } = req.body;
// //   const authHeader = {
// //     Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
// //     "Content-Type": "application/json",
// //   };
// //   try {
// //     // 1. Create Unzer Customer
// //     const customerRes = await axios.post(
// //       "https://api.unzer.com/v1/customers",
// //       {
// //         firstname: username || "Test",
// //         lastname: "Customer",
// //         email: email || `user${user_id}@example.com`,
// //       },
// //       { headers: authHeader }
// //     );
// //     const customerId = customerRes.data.id;

// //     // 2. Create SEPA payment type
// //     const sepaRes = await axios.post(
// //       "https://api.unzer.com/v1/types/sepa-direct-debit",
// //       {
// //         iban: iban || "DE89370400440532013000",
// //         holder: username || "Test Holder",
// //       },
// //       { headers: authHeader }
// //     );
// //     const paymentTypeId = sepaRes.data.id;

// //     // 3. Charge (fix: put typeId and customerId inside resources)
// //     const chargePayload = {
// //       amount: amount,
// //       currency: "EUR",
// //       orderId: `SUBS-${user_id}-${Date.now()}`,
// //       resources: {
// //         typeId: paymentTypeId,
// //         customerId: customerId
// //       },
// //       additionalTransactionData: {
// //         sepaDirectDebit: {
// //           recurrenceType: "scheduled",
// //         },
// //       },
// //     };
// //     console.log("Unzer Charge Payload:", chargePayload);

// //     const payRes = await axios.post(
// //       "https://api.unzer.com/v1/payments/charges",
// //       chargePayload,
// //       { headers: authHeader }
// //     );

// //     res.json({
// //       unzer_charge_url: "https://api.unzer.com/v1/payments/charges",
// //       payload: chargePayload,
// //       response: payRes.data,
// //     });
// //   } catch (err) {
// //     console.error("Unzer charge error:", err.response?.data || err.message);
// //     res.status(500).json({
// //       error: err.response?.data || err.message,
// //     });
// //   }
// // });

// // Customer starts PayPal subscription
// app.post("/all_subscribe_paypal", async (req, res) => {
//   try {
//     const typeRes = await axios.post(
//       "https://api.unzer.com/v1/types/paypal",
//       {
//         recurrenceType: "ONECLICK", // ensures reusability
//         returnUrl: "http://localhost:4200/paypal-success",
//         cancelUrl: "http://localhost:4200/paypal-failed"
//       },
//       {
//         headers: {
//           Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const typeId = typeRes.data.id; // save this for recurring billing

//     // Authorize initial (small or first subscription payment)
//     const authRes = await axios.post(
//       "https://api.unzer.com/v1/payments/authorize",
//       {
//         amount: 0.10, // small test or first sub fee
//         currency: "EUR",
//         returnUrl: "http://localhost:4200/paypal-success",
//         resources: { typeId }
//       },
//       {
//         headers: {
//           Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     res.json({
//       redirectUrl: authRes.data.redirectUrl, // send to PayPal
//       typeId,
//       paymentId: authRes.data.resources.paymentId
//     });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ error: "PayPal setup failed" });
//   }
// });

// app.post("/save-paypal-subscription", async (req, res) => {
//   try {
//     const { paymentId, typeId, userId } = req.body;

//     if (!paymentId || !typeId || !userId) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // 🔁 Save into users table (adjust to your schema)
//     await db.promise().query(
//       "UPDATE users SET paypal_payment_id = ?, paypal_type_id = ? WHERE id = ?",
//       [paymentId, typeId, userId]
//     );

//     res.json({ success: true, message: "PayPal subscription saved successfully" });
//   } catch (err) {
//     console.error("❌ Error saving PayPal subscription:", err.message);
//     res.status(500).json({ error: "Database error while saving subscription" });
//   }
// });




// 1. Get all unique billing months (no duplicates)


/**
 * Step 1: Create PayPal type + Authorize payment
 */
// app.post("/all_subscribe_paypal", async (req, res) => {
//   try {
//     const headers = {
//       Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
//       "Content-Type": "application/json"
//     };

//     // Step 1: Create PayPal type
//     const typeRes = await axios.post(
//       "https://api.unzer.com/v1/types/paypal",
//       {
//         recurrenceType: "ONECLICK",

//         // returnUrl: "http://localhost:4200/paypal-subscription-success",
//         // cancelUrl: "http://localhost:4200/paypal-subscription-failed"
//         returnUrl: "https://frischfuersie.de/paypal-subscription-success",
//         cancelUrl: "https://frischfuersie.de/paypal-subscription-failed"
//       },
//       { headers }
//     );

//     const typeId = typeRes.data.id;

//     // Step 2: Authorize initial payment
//     const authRes = await axios.post(
//       "https://api.unzer.com/v1/payments/authorize",
//       {
//         amount: 0.10,   // first test or setup fee
//         currency: "EUR",
//         // returnUrl: "http://localhost:4200/paypal-subscription-success",
//           returnUrl: "https://frischfuersie.de/paypal-subscription-success",
//         resources: { typeId }
//       },
//       { headers }
//     );

//     const paymentId = authRes.data.resources.paymentId;

//     // Step 3: Return data to frontend
//     res.json({
//       redirectUrl: authRes.data.redirectUrl,  // iframe PayPal page
//       typeId,
//       paymentId
//     });
//   } catch (err) {
//     console.error("❌ Error in /all_subscribe_paypal:", err.response?.data || err.message);
//     res.status(500).json({ error: "PayPal setup failed" });
//   }
// });

// app.post("/all_subscribe_paypal", async (req, res) => {
//   try {
//     const headers = {
//       Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,
//       "Content-Type": "application/json"
//     };

//     // Step 1: Create or reuse a customer
//     const customerRes = await axios.post(
//       "https://api.unzer.com/v1/customers",
//       {
//         firstname: "John",
//         lastname: "Doe",
//         email: "john.doe@example.com"
//       },
//       { headers }
//     );
//     const customerId = customerRes.data.id;

//     // Step 2: Create PayPal payment type (ONECLICK)
//     const typeRes = await axios.post(
//       "https://api.unzer.com/v1/types/paypal",
//       {
//         recurrenceType: "ONECLICK",
//         returnUrl: "https://frischfuersie.de/paypal-subscription-success",
//         cancelUrl: "https://frischfuersie.de/paypal-subscription-failed"
//       },
//       { headers }
//     );

//     const typeId = typeRes.data.id;

//     // ✅ Step 3: Register recurring ON the type endpoint (with customerId)
//     const recurringRes = await axios.post(
//       `https://api.unzer.com/v1/types/${typeId}/recurring`,
//       {
//         customerId,
//         currency: "EUR",
//         returnUrl: "https://frischfuersie.de/paypal-subscription-success",
//         cancelUrl: "https://frischfuersie.de/paypal-subscription-failed"
//       },
//       { headers }
//     );

//     // Step 4: Handle redirect
//     if (recurringRes.data.isPending && recurringRes.data.redirectUrl) {
//       return res.json({
//         typeId,
//         customerId,
//         redirectUrl: recurringRes.data.redirectUrl
//       });
//     } else {
//       return res.status(400).json({
//         error: "Recurring registration failed",
//         details: recurringRes.data
//       });
//     }

//   } catch (err) {
//     console.error("❌ Error in PayPal recurring:", err.response?.data || err.message);
//     return res.status(500).json({ error: "PayPal recurring setup failed" });
//   }
// });


app.post("/all_subscribe_paypal", async (req, res) => {
  try {
    const headers = {
      Authorization: `Basic ${Buffer.from(`${UNZER_PRIVATE_KEY}:`).toString("base64")}`,

      "Content-Type": "application/json"
    };

    // Step 1: Create PayPal payment type (ONECLICK)
    const typeRes = await axios.post(
      "https://api.unzer.com/v1/types/paypal",
      {
        recurrenceType: "ONECLICK",
        returnUrl: "https://frischfuersie.de/paypal-subscription-success",
        cancelUrl: "https://frischfuersie.de/paypal-subscription-failed"
      },
      { headers }
    );

    const typeId = typeRes.data.id;

    // Step 2: Register the PayPal type for recurring
    const recurringRes = await axios.post(
      `https://api.unzer.com/v1/types/${typeId}/recurring`,
      {
        currency: "EUR",
        returnUrl: "https://frischfuersie.de/paypal-subscription-success",
        cancelUrl: "https://frischfuersie.de/paypal-subscription-failed",
        //  returnUrl: "http://localhost:4200/paypal-subscription-success",
        //   cancelUrl: "http://localhost:4200/paypal-subscription-failed",
      },
      { headers }
    );

    if (recurringRes.data.isPending && recurringRes.data.redirectUrl) {
      // Send redirect URL to frontend
      return res.json({
        typeId,
        redirectUrl: recurringRes.data.redirectUrl
      });
    } else {
      return res.status(400).json({
        error: "Recurring registration failed",
        details: recurringRes.data
      });
    }

  } catch (err) {
    console.error("❌ Error in PayPal recurring:", err.response?.data || err.message);
    return res.status(500).json({ error: "PayPal recurring setup failed" });
  }
});



/**
 * Step 2: Save subscription details into DB
 */
// Save PayPal subscription order
app.post("/save-paypal-subscription", async (req, res) => {
  try {
    const {
      user_id,
      productDetails,
      delivery_date,
      price,
      tips,
      deliveryFee,
      instruction,
      paymentType,
      address,
      contact,
      paymentId,
      typeId
    } = req.body;

    if (!user_id || !productDetails) {
      return res.status(400).json({ message: "Missing required fields" });
    }


    // Build order data
    const currentDateIST = new Date().toLocaleDateString('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '');
    const newOrderId = `FfSs_${currentDateIST}_${Math.floor(1000 + Math.random() * 9000)}`;
    const orderData = {
      order_id: newOrderId,
      user_id: user_id,
      price: parseFloat(price),
      paymentType: paymentType.toUpperCase(), // e.g., "SEPA"
      status: 1,
      delivery_date: delivery_date,
      tips: parseFloat(tips || 0),
      // delivery_fee: parseFloat(deliveryFee || 0),
      instruction: instruction || "",
      address: address || "",
      contact: contact || "",
      paymentId: paymentId,
      typeId: typeId,

      // created_at: new Date(),
    };

    // Save into orders + orders_details
    const result = await orders.create(orderData, productDetails);

    return res.status(200).json({
      message: "Subscription saved successfully",
      orderId: result.orderId,
      products: result.products || [],
    });
  } catch (err) {
    console.error("Error saving SEPA subscription:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



app.get('/subscription/billing-months', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT DISTINCT billing_month FROM subscription_transactions ORDER BY billing_month DESC'
    );
    // Return as array of strings
    const months = rows.map(row => row.billing_month);
    res.json({ months });
  } catch (err) {
    console.error('Error fetching billing months:', err);
    res.status(500).json({ error: 'Failed to fetch billing months' });
  }
});

// 2. Get all transactions for a given month and year
app.get('/subscription/transactions', async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ error: 'month and year are required' });
  }
  const billingMonth = `${year}-${month.padStart(2, '0')}`;
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM subscription_transactions WHERE billing_month = ? ORDER BY `subscription_transactions`.`created_at` DESC',
      [billingMonth]
    );
    res.json({ transactions: rows });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


// cron.schedule('0 15 * * 1', // Every Monday at 15:00 (3 PM)
// cron.schedule('0 14 * * 5', // Every Friday at 16:00 (4 PM)  -- server time 14 means local german 4 pm call will run
// // cron.schedule('* * * * *', // every minute (for testing)
//   async () => {
//   try {
//     const [subscriptions] = await db.promise().query(
//       "SELECT * FROM all_subscription WHERE status = 1"
//     );

//     for (const sub of subscriptions) {
//       const originalDay = moment(sub.delivery_date).day(); // 6 = Saturday, 0 = Sunday

//       // Calculate next delivery day (same weekday as original subscription)
//       const today = moment();
//       const targetDay = originalDay < today.day() ? originalDay + 7 : originalDay;
//       const nextDeliveryDate = moment().day(targetDay).format('YYYY-MM-DD');

//       // Skip if within vacation period
//       const isOnVacation = sub.vacation_start && sub.vacation_end &&
//         moment(nextDeliveryDate).isBetween(
//           moment(sub.vacation_start),
//           moment(sub.vacation_end),
//           undefined,
//           '[]' // inclusive
//         );

//       if (isOnVacation) {
//         console.log(` Skipping order for user ${sub.user_id} due to vacation.`);
//         continue;
//       }

//       // Generate new order ID
//       const newOrderId = `FfSs_${moment().format('DDMMYYYY')}_${Math.floor(Math.random() * 9000 + 1000)}`;

//       // Prepare subscription data
//       const newSub = {
//         ...sub,
//         order_id: newOrderId,
//         delivery_date: nextDeliveryDate,
//         subscription_id: sub.id,
//         status:'pending' // Set status to pending for new subscription
//       };
//       delete newSub.id; // remove old ID for new row insert

//       // Insert into `subscription` table (not `all_subscription`)
//       await db.promise().query("INSERT INTO subscription SET ?", newSub);

//       // Copy products from original order
//       const [orderItems] = await db.promise().query(
//         "SELECT product_name, quantity, price FROM orders_details WHERE order_id = ?",
//         [sub.order_id]
//       );

//       // Insert order details for new order
//       for (const item of orderItems) {
//         await db.promise().query(
//           "INSERT INTO orders_details (order_id, product_name, quantity, price) VALUES (?, ?, ?, ?)",
//           [newOrderId, item.product_name, item.quantity, item.price]
//         );
//       }
//       const formattedProducts = orderItems.map(item => [item.product_name, item.quantity, item.price]);
//       // Fetch user info for email
//       const [userRows] = await db.promise().query(
//         "SELECT username, email FROM users WHERE id = ?",
//         [sub.user_id]
//       );

//       if (!userRows || userRows.length === 0) {
//         console.warn(` User not found for user_id: ${sub.user_id}`);
//         continue;
//       }

//       const user = userRows[0];

//       const orderData = {
//         order_id: newOrderId,
//         user_id: sub.user_id,
//         delivery_date: new Date(nextDeliveryDate).toISOString().slice(0, 19).replace("T", " "),
//         address: sub.address,
//         contact: sub.contact,
//         instruction: sub.instruction,
//         price: sub.price,
//         tips: sub.tips,
//         lat: sub.lat,
//         lng: sub.lng,

//         zipcode: sub.zipcode || ''
//       };

//       const userData = {
//         username: user.username,
//         email: user.email,
//         deliveryFee: sub.deliveryFee || 0
//       };

//       const mailResult = await orderConfirmMail(orderData, formattedProducts, userData);
//       if (!mailResult.success) {
//         console.error(`📧 Email failed for order ${newOrderId}`, mailResult);
//       }

//       console.log(`✅ Subscription order created for user ${sub.user_id} - Delivery on ${nextDeliveryDate}`);
//     }
//   } catch (err) {
//     console.error("❌ Cron job error:", err.message);
//   }
// });

// cron.schedule('* * * * *', // every minute (for testing)
// cron.schedule('0 14 * * 5', // every Friday at 14:00 (Server Time)
cron.schedule('30 12 * * 0', // every Sunday at 12:30 (Server Time)
  async () => {   // Server 14:00 = German 16:00
    try {
      const [subscriptions] = await db.promise().query(
        "SELECT * FROM all_subscription WHERE status = 1"
      );

      for (const sub of subscriptions) {
        const deliveryOption = sub.deliveryDayOption; // 'saturday' | 'sunday' | 'both'

        console.log(`Processing subscription for ${sub.user_id} - option: ${deliveryOption}`);

        // Determine delivery days needed
        const deliveryDays = [];

        if (deliveryOption === "saturday") deliveryDays.push(6);  // Saturday
        if (deliveryOption === "sunday") deliveryDays.push(0);    // Sunday
        if (deliveryOption === "both") deliveryDays.push(6, 0);   // Sat + Sun

        // Process each delivery day independently
        for (const dayCode of deliveryDays) {

          const today = moment();
          const todayDay = today.day();

          const nextDeliveryDate =
            dayCode <= todayDay
              ? moment().day(dayCode + 7).format('YYYY-MM-DD')
              : moment().day(dayCode).format('YYYY-MM-DD');

          // Check vacation period
          const isOnVacation =
            sub.vacation_start &&
            sub.vacation_end &&
            moment(nextDeliveryDate).isBetween(
              moment(sub.vacation_start),
              moment(sub.vacation_end),
              undefined,
              "[]"
            );

          if (isOnVacation) {
            console.log(`Skipping ${nextDeliveryDate} for user ${sub.user_id} due to vacation.`);
            continue;
          }

          // New order ID
          const newOrderId = `FfSs_${moment().format("DDMMYYYY")}_${Math.floor(Math.random() * 9000 + 1000)}`;

          // Prepare subscription row
          const newSub = {
            ...sub,
            order_id: newOrderId,
            delivery_date: nextDeliveryDate,
            subscription_id: sub.id,
            status: "pending"
          };
          delete newSub.id;

          await db.promise().query("INSERT INTO subscription SET ?", newSub);

          // Copy product items
          const [orderItems] = await db.promise().query(
            "SELECT product_name, quantity, price FROM orders_details WHERE order_id = ?",
            [sub.order_id]
          );

          for (const item of orderItems) {
            await db.promise().query(
              "INSERT INTO orders_details (order_id, product_name, quantity, price) VALUES (?, ?, ?, ?)",
              [newOrderId, item.product_name, item.quantity, item.price]
            );
          }

          const formattedProducts = orderItems.map(item => [item.product_name, item.quantity, item.price]);

          // Fetch user info
          const [userRows] = await db.promise().query(
            "SELECT username, email FROM users WHERE id = ?",
            [sub.user_id]
          );

          if (!userRows || userRows.length === 0) {
            console.warn(`User not found for ID: ${sub.user_id}`);
            continue;
          }

          const user = userRows[0];

          const orderData = {
            order_id: newOrderId,
            user_id: sub.user_id,
            delivery_date: nextDeliveryDate,
            deliveryFee: sub.deliveryFee || 0,
            address: sub.address,
            contact: sub.contact,
            instruction: sub.instruction,
            price: sub.price,
            tips: sub.tips,
            lat: sub.lat,
            lng: sub.lng,
            zipcode: sub.zipcode || ''
          };

          const userData = {
            username: user.username,
            email: user.email
          };

          const mailResult = await orderConfirmMail(orderData, formattedProducts, userData);
          if (!mailResult.success) {
            console.error(`Email failed for order ${newOrderId}`, mailResult);
          }

          console.log(`✅ Subscription order created for user ${sub.user_id} on ${nextDeliveryDate}`);
        }
      }
    } catch (err) {
      console.error("❌ Cron job error:", err.message);
    }
  });


app.get("/production/pdf", (req, res) => {
  const { date, category } = req.query;

  if (!date || !category) {
    return res.status(400).send("Date and category are required.");
  }
  // let pool = dbPRomise
  let pool = db

  // Step 1: Get all order IDs for the given date
  // pool.query(
  //   `SELECT order_id FROM orders WHERE delivery_date = ? AND status = 'processing'`,
  //   [date],
  //   (err, orderIdsResult) => {
  //     if (err) {
  //       console.error("Error fetching order IDs:", err);
  //       return res.status(500).send("Internal server error.");
  //     }

  //     const orderIds = orderIdsResult.map(row => row.order_id);

  pool.query(
    `SELECT order_id FROM orders WHERE delivery_date = ? AND status IN ('Assigned', 'processing')`,
    [date],
    (err, normalOrdersResult) => {
      if (err) {
        console.error("Error fetching normal order IDs:", err);
        return res.status(500).send("Internal server error.");
      }

      pool.query(
        `SELECT order_id FROM subscription WHERE delivery_date = ? AND status IN ('Assigned', 'processing')`,
        [date],
        (err, subscriptionOrdersResult) => {
          if (err) {
            console.error("Error fetching subscription order IDs:", err);
            return res.status(500).send("Internal server error.");
          }

          // Collect both
          const orderIds = [
            ...normalOrdersResult.map(row => row.order_id),
            ...subscriptionOrdersResult.map(row => row.order_id),
          ];


          if (orderIds.length === 0) {
            return res.status(404).send("No orders found for the given date.");
          }

          // Step 2: Get total quantity of products based on category
          pool.query(
            `
        SELECT 
          od.product_name, 
          SUM(od.quantity) AS total_quantity
        FROM 
          orders_details AS od
        INNER JOIN 
          product AS p ON od.product_name = p.product_name
        INNER JOIN 
          category AS c ON p.category_id = c.id
        INNER JOIN
          main_category AS mc ON c.category_type = mc.category_name
        WHERE 
          od.order_id IN (?) AND mc.id = ?
        GROUP BY 
          od.product_name
        `,
            [orderIds, category],
            async (err, productQuantities) => {
              if (err) {
                console.error("Error fetching product quantities:", err);
                return res.status(500).send("Internal server error.");
              }

              if (productQuantities.length === 0) {
                return res.status(404).send("No products found matching the given category.");
              }

              try {
                // Step 3: Render EJS
                const html = await ejs.renderFile(
                  path.join(__dirname, "./views/product.ejs"),
                  { products: productQuantities, date }
                );

                // Step 4: Generate PDF
                // const browser = await puppeteer.launch();
                const browser = await puppeteer.launch({
                  args: ['--no-sandbox', '--disable-setuid-sandbox']
                });

                const page = await browser.newPage();

                await page.setContent(html, { waitUntil: "load" });

                const pdfPath = path.join(__dirname, "productionHouse.pdf");

                const footerTemplate = `
  <div style="font-size: 14px; width: 100%; padding: 10px; color: orangered; font-family: Arial, sans-serif;">
    <hr style="border: 0.5px solid orangered; margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; padding: 0 20px; align-items: flex-start;">
      <div style="line-height: 1.5;">
        <strong>Frisch für Sie</strong><br>
        Lindenhorster Str. 213<br>
        44339 Dortmund <br>
        USt-ID : DE454668064 <br>
        Steuer-Nr : 317/5008/8178 
      </div>
      <div style="line-height: 1.5;">
        <strong>Kontakt</strong><br>
        Tel: +49 1575 2995 881<br>
        Email: info@frischfuersie.de<br>
        Web: frischfuersie.de
      </div>
      <div style="text-align: right;">
        Seite <span class="pageNumber"></span> von <span class="totalPages"></span>
      </div>
    </div>
  </div>
`;



                await page.pdf({
                  path: pdfPath,
                  format: "A4",
                  printBackground: true,
                  margin: {
                    top: "10mm",
                    bottom: "35mm",
                    left: "10mm",
                    right: "10mm",
                  },
                  displayHeaderFooter: true,
                  headerTemplate: '<div style="font-size:10px; text-align:center;"></div>',
                  footerTemplate,
                });

                await browser.close();

                // Step 5: Send file as download
                res.download(pdfPath, "productionHouse.pdf", (err) => {
                  if (err) {
                    console.error("Error sending PDF:", err);
                  }
                  fs.unlink(pdfPath, (err) => {
                    if (err) console.error("Error deleting PDF:", err);
                  });
                });

              } catch (error) {
                console.error("Error generating PDF:", error);
                res.status(500).send("Error rendering or generating PDF.");
              }
            }
          );
        }
      );
    }
  );
});


// app.get("/production/pdf", async (req, res) => {
//   try {
//     // Retrieve date and category from query parameters
//     const { date, category } = req.query;
//     if (!date || !category) {
//       return res.status(400).send("Date and category are required.");
//     }

//     // Query to fetch order_ids from the orders table based on delivery_date
//     const [orderIdsResult] = await db.query(
//       `
//       SELECT order_id 
//       FROM orders 
//       WHERE delivery_date = ?
//       `,
//       [date]
//     );

//     // Extract order IDs into an array
//     const orderIds = orderIdsResult.map(row => row.order_id);
//     if (orderIds.length === 0) {
//       return res.status(404).send("No orders found for the given date.");
//     }

//     // Query to calculate total quantities filtered by category type
//     const [productQuantities] = await db.query(
//       `
//       SELECT 
//         od.product_name, 
//         SUM(od.quantity) AS total_quantity
//       FROM 
//         orders_details AS od
//       INNER JOIN 
//         product AS p ON od.product_name = p.product_name
//       INNER JOIN 
//         category AS c ON p.category_id = c.id
//       WHERE 
//         od.order_id IN (?) AND c.category_type = ?
//       GROUP BY 
//         od.product_name
//       `,
//       [orderIds, category]
//     );

//     if (productQuantities.length === 0) {
//       return res.status(404).send("No products found matching the given category.");
//     }

//     // Render HTML with EJS and the fetched data
//     const html = await ejs.renderFile(path.join(__dirname, "./views/product.ejs"), {
//       products: productQuantities,
//       date: date,
//     });

//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     // Set page content
//     await page.setContent(html, { waitUntil: "load" });

//     const pdfPath = path.join(__dirname, "productionHouse.pdf");

//     // Footer template with dynamic page numbers
//     const footerTemplate = `
//       <div class="footer" style="font-size: 14px; width: 100%; text-align: center; padding: 10px;">
//         <hr style="border: 0.5px solid red;">
//         <div style="display: flex; justify-content: space-around; padding: 0 20px;">
//           <div>
//             <p>
//         Frisch für Sie<br>
//         Lindenhorster str. 213<br>
//         44339 Dortmund
//       </p>
//       <p>
//         Tel : +49 1575 2995881<br>
//         Email : info@frischfuersie.de<br>
//         Web : frischfuersie.de
//       </p>
//           </div>
//         </div>
//         <div style="text-align: center; margin-top: 10px;">
//           Page <span class="pageNumber"></span> of <span class="totalPages"></span>
//         </div>
//       </div>
//     `;

//     // Generate PDF with header/footer options
//     await page.pdf({
//       path: pdfPath,
//       format: "A4",
//       printBackground: true,
//       margin: {
//         top: "20mm",
//         bottom: "30mm",
//         left: "10mm",
//         right: "10mm",
//       },
//       displayHeaderFooter: true,
//       footerTemplate: footerTemplate,
//       headerTemplate: '<div style="font-size: 10px; text-align: center;"></div>', // Optional empty header
//     });

//     await browser.close();

//     // Send the PDF file as a response
//     res.download(pdfPath, "productionHouse.pdf", err => {
//       if (err) console.error("Error sending PDF:", err);
//       fs.unlinkSync(pdfPath);
//     });
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).send("Error processing your request.");
//   }
// });


app.post("/payment", function (req, res) {
  // Moreover you can take more details from user
  // like Address, Name, etc from form
  stripe.customers
    .create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken,
      name: "Germenn",
      address: {
        line1: "TC 9/4 Old MES colony",
        postal_code: "452331",
        city: "Indore",
        state: "Madhya Pradesh",
        country: "India"
      }
    })
    .then((customer) => {
      return stripe.charges.create({
        amount: 2500, // Charging Rs 25
        description: "Web Development Product",
        currency: "INR",
        customer: customer.id
      });
    })
    .then((charge) => {
      res.send("Success"); // If no error occurs
    })
    .catch((err) => {
      res.send(err); // If some error occurs
    });
});

// app.post('/api/unzer/paypage', async (req, res) => {
//   try {
//     const { amount, currency, returnUrl } = req.body;

//     // ✅ Basic validation
//     if (!amount || !currency || !returnUrl) {
//       return res.status(400).json({ error: 'amount, currency, and returnUrl are required' });
//     }

//     const response = await fetch('https://api.unzer.com/v1/paypage', {
//       method: 'POST',
//       headers: {
//         Authorization: 'Bearer s-priv-2a10ptr5q2ZTUdI7aYwJqreRyOyIrnjU', // ✅ Ensure this is your valid PRIVATE key
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         amount,
//         currency,
//         returnUrl,
//         resources: {
//           // ✅ Optional - only if you have a customer ID
//           // customerId: 'cust-abc123'
//         }
//       })
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       console.error('Unzer API Error:', data);
//       return res.status(response.status).json({ error: data.message || 'Unzer API error' });
//     }

//     res.send({ payPageId: data.id });
//   } catch (error) {
//     console.error('Server Error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.post('/api/paypage', async (req, res) => {
//   const { amount, currency, returnUrl } = req.body;

//   try {
//     const response = await fetch('https://api.unzer.com/v1/paypage', {
//       method: 'POST',
//       headers: {
//         Authorization: 'Bearer s-priv-2a10ptr5q2ZTUdI7aYwJqreRyOyIrnjU',  // ✅ Use your real Unzer private key here
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         amount,
//         currency,
//         returnUrl
//       })
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       console.error('Unzer error:', data);
//       return res.status(response.status).json(data);
//     }

//     res.json({ payPageId: data.id });
//   } catch (err) {
//     console.error('Server error:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// app.post('/charge', async (req, res) => {
//   const { resourceId, orderId, amount, userId } = req.body;

//   if (!resourceId || !amount || !orderId) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   try {
//     // Unzer API call to charge the payment
//     const response = await axios.post(
//       'https://api.unzer.com/v1/payments/charge',
//       {
//         amount,
//         currency: 'EUR',
//         paymentTypeId: resourceId,
//         // returnUrl: `https://frischfuersie.de/payment-status?orderId=${orderId}`
//                 returnUrl: `http://localhost:4200/payment-status?orderId=${orderId}`

//       },
//       {
//         headers: {
//           Authorization: `Basic ${Buffer.from('s-priv-2a10ptr5q2ZTUdI7aYwJqreRyOyIrnjU').toString('base64')}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     // Optional: Save charge info to your DB
//     const chargeData = response.data;

//     // You could save chargeData.id, status, etc.

//     res.json({ success: true, chargeId: chargeData.id });
//   } catch (error) {
//     console.error('Unzer charge failed:', error.response?.data || error.message);
//     return res.status(500).json({ error: 'Charge failed', details: error.response?.data || error.message });
//   }
// });



// Define additional routes
app.use("/admin", require("./src/routes/admin.route.js"));
app.use("/users", require("./src/routes/users.route.js"));
app.use("/category", require("./src/routes/category.route.js"));
app.use("/main-category", require("./src/routes/main_category.route.js"));
app.use("/product", require("./src/routes/product.route.js"));
app.use("/notifications", require("./src/routes/notification.route.js"));
app.use("/sampleOrder", require("./src/routes/sampleorder.route.js"));
app.use("/deliveryArea", require("./src/routes/area.route.js"));
app.use("/userAdv", require("./src/routes/userAdv.route.js"));
app.use("/jobs", require("./src/routes/jobs.route.js"));
app.use("/address", require("./src/routes/address.route.js"));
app.use("/faq", require("./src/routes/faq.route.js"));
app.use("/role", require("./src/routes/role.route.js"));
app.use("/setting", require("./src/routes/settings.route.js"));
app.use("/impressum", require("./src/routes/impressum.route.js"));
app.use("/coupontype", require("./src/routes/coupontype.route.js"));
app.use("/coupon", require("./src/routes/coupon.route.js"));
app.use("/orders", require("./src/routes/orders.route.js"));
app.use("/cart", require("./src/routes/card.route.js"));
app.use("/contactUs", require("./src/routes/contactUs.route.js"));
app.use("/subscribe-orders", require("./src/routes/subscription.route.js"));
app.use("/all_subscribe-orders", require("./src/routes/all_subscription.route.js"));
app.use("/tax", require("./src/routes/tax.route.js"));
app.use("/bottle", require("./src/routes/bottle.route.js"));
app.use("/combo", require("./src/routes/combo.routes.js"));
app.use("/holiday", require("./src/routes/holiday.route.js"));
app.use("/missingProduct", require("./src/routes/missingProduct.route.js"));


// Start server
const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

module.exports = { app };