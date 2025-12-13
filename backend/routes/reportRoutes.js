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
    const { date, totalSales, cashSales, cardSales, upiSales, creditSales, cashInDrawer, difference } = req.body;

    const timestamp = new Date(date); // Full date-time
    const dailySales = new DailySales({
      date: timestamp,
      totalSales,
      cashSales,
      cardSales,
      upiSales,
      creditSales,
      cashInDrawer,
      difference
    });

    await dailySales.save();

    res.json({ message: "Today’s sales saved", dailySales });
  } catch (err) {
    console.error("Error saving daily sales:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/today-sales", async (req, res) => {
  try {
    const date = new Date(req.query.date);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const totalCount = await DailySales.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const sales = await DailySales.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: sales,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (err) {
    console.error("Error fetching today's sales:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
