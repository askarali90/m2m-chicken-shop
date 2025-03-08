const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// ADD a new product
router.post("/", async (req, res) => {
  try {
    const { productId, name, price, pointsPercentage } = req.body;

    const newProduct = new Product({
        productId,
        name,
        price: parseFloat(price),
        pointsPercentage: parseFloat(pointsPercentage) || 0, // Ensure it's always a number
      });
      

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding product" });
  }
});

// UPDATE a product by productId
router.put("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, price, pointsPercentage } = req.body;

    const updatedProduct = await Product.findOneAndUpdate(
        { productId },
        { 
          name, 
          price: parseFloat(price), 
          pointsPercentage: parseFloat(pointsPercentage) || 0 
        },
        { new: true }
      );
      

    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated successfully", updatedProduct });
  } catch (err) {
    res.status(500).json({ message: "Error updating product" });
  }
});

// DELETE a product by productId
router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const deletedProduct = await Product.findOneAndDelete({ productId });

    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

module.exports = router;
