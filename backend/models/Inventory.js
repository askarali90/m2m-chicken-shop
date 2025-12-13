const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  purchases: [{ 
    date: String,
    liveWeight: Number,
    pricePerKg: Number,
    discount: Number
  }],
  utilizations: [{
    date: String,
    cleanedWeight: Number
  }],
  totalPurchased: Number,
  totalUtilized: Number,
  remaining: Number
});

module.exports = mongoose.model("Inventory", inventorySchema);
