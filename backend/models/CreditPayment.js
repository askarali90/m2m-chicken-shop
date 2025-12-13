const CreditPaymentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  amountPaid: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  balanceAfterPayment: { type: Number, required: true }, // updated balance
});

module.exports = mongoose.model("CreditPayment", CreditPaymentSchema);
