const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// GET all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching customers" });
  }
});

// ADD a new customer
router.post("/", async (req, res) => {
  try {
    const { name, dob, phone, email, address } = req.body;
    
    // Ensure customerId is the phone number
    const customerId = phone;

    const newCustomer = new Customer({
      customerId,
      name,
      dob,
      phone,
      email,
      address,
    });

    await newCustomer.save();
    res.status(201).json({ message: "Customer added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding customer" });
  }
});

// UPDATE a customer by customerId (phone)
router.put("/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const updatedCustomer = await Customer.findOneAndUpdate(
      { customerId }, // Find by customerId (phone)
      req.body,
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer updated successfully", updatedCustomer });
  } catch (err) {
    res.status(500).json({ message: "Error updating customer" });
  }
});

// DELETE a customer by customerId (phone)
router.delete("/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const deletedCustomer = await Customer.findOneAndDelete({ customerId });

    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting customer" });
  }
});

module.exports = router;
