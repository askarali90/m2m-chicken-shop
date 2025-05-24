const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

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
      salesPerDay,
      recentTransactions,
      paymentBreakdown
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
});

module.exports = router;
