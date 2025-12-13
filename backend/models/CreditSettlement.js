const mongoose = require("mongoose");

const CreditSettlementSchema = new mongoose.Schema({
  billId: { type: String, required: true }, // store referenced bill id (could be ObjectId or external id)
  customerId: { type: String, required: true },
  settledAmount: { type: Number, required: true },
  originalTotal: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }, // remaining balance after this settlement
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("CreditSettlement", CreditSettlementSchema);