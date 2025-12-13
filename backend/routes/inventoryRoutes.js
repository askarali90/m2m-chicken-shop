const express = require("express");
const InventoryModel = require("../models/Inventory"); // path may vary
const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const records = await InventoryModel.find().sort({ date: -1 }); // latest first
    res.json(records);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/save", async (req, res) => {
  try {
    // console.log("Incoming inventory data:", req.body); // 👈 Add this

    const { date, purchases, utilizations, totalPurchased, totalUtilized, remaining } = req.body;

    const record = new InventoryModel({
      date,
      purchases,
      utilizations,
      totalPurchased,
      totalUtilized,
      remaining
    });

    await record.save();
    res.json({ message: "Inventory saved successfully" });
  } catch (err) {
    console.error("Inventory Save Error:", err); // 👈 This will show the real issue
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


module.exports = router;
