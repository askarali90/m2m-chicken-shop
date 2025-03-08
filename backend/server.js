require("dotenv").config({ path: "./config/.env" });  // Load .env from config folder

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(cors());


// Ensure MONGO_URI is available
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file!");
  process.exit(1);
}

// Fix Mongoose Deprecation Warning
mongoose.set("strictQuery", false);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Import routes
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const reportsRoutes = require("./routes/reportRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes"); // Adjust path if needed
app.use("/api/checkout", checkoutRoutes);
// Use routes
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportsRoutes);




// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
