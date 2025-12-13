const express = require("express");
const router = express.Router();
const CreditPayment = require("../models/CreditPayment");
const CreditBill = require("../models/CreditBill"); 

router.post("/credit-bill", async (req, res) => {
  try {
    const { customerId, products, billAmount } = req.body;

    // Find last balance
    const lastBill = await CreditBill.findOne({ customer: customerId }).sort({ date: -1 });
    const lastPayment = await CreditPayment.findOne({ customer: customerId }).sort({ date: -1 });

    const currentBalance = (lastBill?.balance || 0) - (lastPayment?.amountPaid || 0);
    const newBalance = currentBalance + billAmount;

    const creditBill = new CreditBill({
      customer: customerId,
      products,
      billAmount,
      balance: newBalance
    });

    await creditBill.save();
    res.json({ message: "Credit bill created", creditBill });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/credit-payment", async (req, res) => {
  try {
    const { customerId, amountPaid } = req.body;

    // Get last balance
    const lastBill = await CreditBill.findOne({ customer: customerId }).sort({ date: -1 });
    const lastPayment = await CreditPayment.findOne({ customer: customerId }).sort({ date: -1 });

    const currentBalance = (lastBill?.balance || 0) - (lastPayment?.amountPaid || 0);
    const newBalance = currentBalance - amountPaid;

    const payment = new CreditPayment({
      customer: customerId,
      amountPaid,
      balanceAfterPayment: newBalance
    });

    await payment.save();
    res.json({ message: "Payment recorded", payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
