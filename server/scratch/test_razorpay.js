import "dotenv/config";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

async function test() {
  try {
    const options = {
      amount: 299 * 100, // ₹299 in paise
      currency: "INR",
      receipt: `receipt_verify_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    console.log("SUCCESS:", order);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
