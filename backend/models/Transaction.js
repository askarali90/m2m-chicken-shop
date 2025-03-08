const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  customerId: { type: String, required: true }, // Storing phone number
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
  earnedPoints: { type: Number, required: true },
  redeemedPoints: {type: Number },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
