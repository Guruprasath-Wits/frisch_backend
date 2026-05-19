const dbConfig = require('./src/helpers/db.js');
const db = dbConfig.promise();

async function check() {
  try {
    const [orders] = await db.query("SELECT order_id, delivery_date, status FROM orders LIMIT 10");
    console.log("Normal Orders:", orders);
    
    const [subs] = await db.query("SELECT order_id, delivery_date, status FROM subscription LIMIT 10");
    console.log("Subscription Orders:", subs);
    
    const [cats] = await db.query("SELECT id, category_name FROM main_category");
    console.log("Main Categories:", cats);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
