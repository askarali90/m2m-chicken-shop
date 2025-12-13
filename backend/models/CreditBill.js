const mongoose = require("mongoose");

const CreditBillSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      price: Number,
      total: Number
    }
  ],
  billAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  balance: { type: Number, required: true }, // running balance after this bill
});

module.exports = mongoose.model("CreditBill", CreditBillSchema);
