const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
  customerId: { type: String, required: true }, // Store phone number
  cart: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      total: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  finalAmount: { type: Number },
  redeemedPoints: { type: Number },
  earnedPoints: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  modeOfPayment: { type: String }
});

module.exports = mongoose.model("Bill", BillSchema);
