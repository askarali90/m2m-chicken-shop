const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true }, // Customer ID is phone number
  name: { type: String, required: true },
  dob: { type: String }, 
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  redeemablePoints: { type: Number, default: 0 }, 
  totalRedeemedPoints: { type: Number, default: 0 } 
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
