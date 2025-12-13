const mongoose = require("mongoose");

const DailySalesSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  totalSales: { type: Number, default: 0 },
  cashSales: { type: Number, default: 0 },
  cardSales: { type: Number, default: 0 },
  upiSales: { type: Number, default: 0 },
  creditSales: { type: Number, default: 0 },
  cashInDrawer: { type: Number, default: 0 },
  difference: { type: Number, default: 0 }
});

module.exports = mongoose.model("DailySales", DailySalesSchema);
