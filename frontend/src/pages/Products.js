import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Table } from "react-bootstrap";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    name: "",
    price: "",
    pointsPercentage: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  // Show modal for Add/Edit
  const handleShowModal = (product = null) => {
    setCurrentProduct(product);
    setFormData(
      product
        ? { ...product, pointsPercentage: parseFloat(product.pointsPercentage) || 0 }
        : {
            productId: `Prod_${Math.floor(10000 + Math.random() * 90000)}`, // Auto-generate ID
            name: "",
            price: "",
            pointsPercentage: 0,
          }
    );
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Add/Edit product
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        // Update product
        await axios.put(
          `http://localhost:5000/api/products/${formData.productId}`, // Fixed productId
          formData
        );
      } else {
        // Add new product
        await axios.post("http://localhost:5000/api/products", formData);
      }
      fetchProducts();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving product", err);
    }
  };

  // Handle Delete product
  const handleDelete = async (productId) => {
    if (!productId) {
      console.error("Invalid productId:", productId);
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product", err);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="header-container justify-content-between">
        <h2>Products</h2>
        <Button variant="dark" onClick={() => handleShowModal()}>Add Product</Button>
      </div>      
      <Table striped bordered hover className="mt-3">
        <thead className="table-dark">
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Points Calculation (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.productId}>
              <td>{product.productId}</td>
              <td>{product.name}</td>
              <td>₹{product.price}</td>
              <td>{(product.pointsPercentage || 0).toFixed(4)} %</td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleShowModal(product)}>Edit</Button>
                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(product.productId)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for Add/Edit */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{currentProduct ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Product ID</Form.Label>
              <Form.Control type="text" name="productId" value={formData.productId} disabled />
            </Form.Group>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Points Calculation (%)</Form.Label>
              <Form.Control
                type="number"
                step="0.0001"
                name="pointsPercentage"
                value={formData.pointsPercentage}
                onChange={handleChange}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              {currentProduct ? "Update" : "Add"} Product
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Products;
