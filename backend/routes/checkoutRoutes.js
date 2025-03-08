const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const Bill = require("../models/Bill"); // Import Bill Model

// Checkout Route
router.post("/", async (req, res) => {
  try {
    const { customerId, totalAmount, finalAmount, cart, redeemedPoints } = req.body;

    // Find the customer by phone number
    const customer = await Customer.findOne({ phone: customerId });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Calculate earned points for this transaction
    let earnedPoints = cart.reduce((total, item) => total + item.total * item.pointsPercentage, 0);

    // Ensure the redeemed points do not exceed the available points
    let pointsToDeduct = Math.min(redeemedPoints || 0, customer.redeemablePoints);
    
    // Deduct redeemable points & accumulate redeemed history
    customer.redeemablePoints -= pointsToDeduct;
    customer.totalRedeemedPoints = (customer.totalRedeemedPoints || 0) + pointsToDeduct;

    // Add newly earned points
    customer.redeemablePoints += earnedPoints;

    // Save updated customer details
    await customer.save();

    // Save transaction history
    const newTransaction = new Transaction({
      customerId: customer.phone,
      cart,
      totalAmount,
      finalAmount, // UI sends this
      redeemedPoints: pointsToDeduct,
      earnedPoints,
      date: new Date(),
    });

    await newTransaction.save();

    // Save bill separately for reports
    const newBill = new Bill({
      customerId: customer.phone,
      cart,
      totalAmount,
      finalAmount,
      redeemedPoints: pointsToDeduct,
      earnedPoints,
      date: new Date(),
    });

    await newBill.save();

    res.status(200).json({
      message: "Checkout successful",
      earnedPoints,
      redeemedPoints: pointsToDeduct,
      finalAmount,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all bills
router.get("/", async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bills", error });
  }
});

module.exports = router;
