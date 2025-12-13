const express = require("express");
const router = express.Router();

const CreditSettlement = require("../models/CreditSettlement");
const CreditBill = require("../models/CreditBill");
let CreditPayment;
try {
  CreditPayment = require("../models/CreditPayment");
} catch (e) {
  CreditPayment = null;
}

// GET /api/credit-settlements
router.get("/", async (req, res) => {
  try {
    const settlements = await CreditSettlement.find().sort({ date: -1 });
    res.json(settlements);
  } catch (err) {
    console.error("Error fetching credit settlements:", err);
    res.status(500).json({ message: "Server error fetching settlements" });
  }
});

// POST /api/credit-settlements
// Accepts { settlements: [...] } or single object
router.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const items = Array.isArray(payload.settlements) ? payload.settlements : (Array.isArray(payload) ? payload : [payload]);

    const createdDocs = [];
    for (const it of items) {
      const settledAmount = Number(it.settledAmount) || 0;
      const originalTotal = Number(it.originalTotal) || 0;
      const billId = it.billId;
      const customerId = it.customerId;
      const date = it.date ? new Date(it.date) : new Date();

      // Try to compute balance:
      // 1) If CreditBill exists, use its balance (or originalTotal) and subtract settledAmount, then persist new balance on CreditBill.
      // 2) Otherwise compute from previous settlements for the same bill: originalTotal - (sum(prevSettlements) + this settlement)
      let newBalance = Math.max(0, originalTotal - settledAmount);

      try {
        const cb = await CreditBill.findById(billId);
        if (cb) {
          const prevBalance = typeof cb.balance === "number" ? cb.balance : originalTotal;
          newBalance = Math.max(0, prevBalance - settledAmount);
          cb.balance = newBalance;
          await cb.save();
        } else {
          // sum previous settlements for this bill
          const prevSettlements = await CreditSettlement.find({ billId });
          const prevSum = prevSettlements.reduce((s, p) => s + (p.settledAmount || 0), 0);
          newBalance = Math.max(0, originalTotal - (prevSum + settledAmount));
        }
      } catch (innerErr) {
        // fallback: compute simple balance from originalTotal
        console.warn("Could not compute from CreditBill, falling back to simple calc:", innerErr.message);
        newBalance = Math.max(0, originalTotal - settledAmount);
      }

      const settlementDoc = await CreditSettlement.create({
        billId,
        customerId,
        settledAmount,
        originalTotal,
        balance: newBalance,
        date
      });

      // Optionally create a CreditPayment record if model exists
      if (CreditPayment) {
        try {
          await CreditPayment.create({
            bill: billId,
            amount: settledAmount,
            date,
            customerId,
            note: it.note || "Settlement via credit-settlements API"
          });
        } catch (payErr) {
          console.warn("CreditPayment creation failed:", payErr.message);
        }
      }

      createdDocs.push(settlementDoc);
    }

    res.status(201).json(createdDocs.length === 1 ? createdDocs[0] : createdDocs);
  } catch (err) {
    console.error("Error saving credit settlements:", err);
    res.status(500).json({ message: "Server error saving settlements" });
  }
});

module.exports = router;