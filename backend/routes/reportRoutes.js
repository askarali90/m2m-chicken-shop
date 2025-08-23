const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const DailySales = require("../models/DailySales");

// GET Dashboard Summary
router.get("/summary", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total Sales (Sum of all bills)
    const totalSales = await Bill.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);

    const paymentBreakdown = await Bill.aggregate([
      {
        $match: {
          date: { $gte: today },
        },
      },
      {
        $group: {
          _id: "$modeOfPayment",
          total: { $sum: "$finalAmount" },
        },
      },
    ]);

    const totalKgs = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$kgsAccumulated" }
        }
      }
    ]);


    // Total Customers
    const totalCustomers = await Customer.countDocuments();

    // Total Products
    const totalProducts = await Product.countDocuments();

    // Get Sales per Day
    const salesPerDay = await Bill.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: -1 } }, // Sort by most recent date
    ]);

    // Recent Transactions (Last 5 Transactions)
    const recentTransactions = await Bill.find().sort({ date: -1 }).limit(5);

    res.json({
      totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
      totalCustomers,
      totalProducts,
      totalKgsAccumulated: totalKgs.length > 0 ? totalKgs[0].total : 0,
      salesPerDay,
      recentTransactions,
      paymentBreakdown
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
});

router.post("/save-today", async (req, res) => {
  try {
    const { date, totalSales, cashSales, cardSales, upiSales, cashInDrawer, difference } = req.body;

    // Upsert today's record
    const today = new Date(date).toISOString().split("T")[0]; // yyyy-mm-dd
    const dailySales = await DailySales.findOneAndUpdate(
      { date: today },
      { date: today, totalSales, cashSales, cardSales, upiSales, cashInDrawer, difference },
      { upsert: true, new: true }
    );

    res.json({ message: "Today’s sales saved", dailySales });
  } catch (err) {
    console.error("Error saving daily sales:", err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
