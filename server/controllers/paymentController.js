import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/booking.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const amount = booking.amount * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${bookingId}`,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create Razorpay order" });
  }
};

// Verify & Mark Booking as Paid
export const markBookingPaid = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    booking.isPaid = true;
    booking.paymentInfo = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    };
    await booking.save();

    res.json({
      success: true,
      message: "Payment verified and booking marked as paid",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
};
