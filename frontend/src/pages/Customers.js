import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Table, Pagination } from "react-bootstrap";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers", err);
    }
  };

  const handleShowModal = (customer = null) => {
    setCurrentCustomer(customer);
    setFormData(
      customer || {
        name: "",
        dob: "",
        phone: "",
        email: "",
        address: "",
      }
    );
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePhoneNumber = (phone) => {
    return /^[6789]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone Number are required!");
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      alert("Invalid phone number! Enter a valid 10-digit Indian mobile number.");
      return;
    }

    const customerData = {
      ...formData,
      customerId: formData.phone, // Set customerId as phone number
    };

    try {
      if (currentCustomer) {
        await axios.put(`http://localhost:5000/api/customers/${currentCustomer.customerId}`, customerData);
      } else {
        await axios.post("http://localhost:5000/api/customers", customerData);
      }
      fetchCustomers();
      handleCloseModal();
    } catch (err) {
      alert("Error Saving Customer.");
      console.error("Error saving customer", err);
    }
  };

  const handleDelete = async (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await axios.delete(`http://localhost:5000/api/customers/${customerId}`);
        fetchCustomers();
      } catch (err) {
        console.error("Error deleting customer", err);
      }
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(customers.length / itemsPerPage);

  return (
    <div className="container-fluid mt-4">
      <div className="header-container">
        <h2>Customers</h2>
        <Button variant="dark" onClick={() => handleShowModal()}>Add Customer</Button>
      </div>

      <Table striped bordered hover className="mt-3">
        <thead className="table-dark">
          <tr>
            <th onClick={() => handleSort("customerId")}>Customer ID</th>
            <th onClick={() => handleSort("name")}>Name</th>
            <th onClick={() => handleSort("dob")}>DOB</th>
            {/* <th onClick={() => handleSort("phone")}>Phone</th> */}
            <th onClick={() => handleSort("email")}>Email</th>
            {/* <th onClick={() => handleSort("address")}>Address</th> */}
            <th onClick={() => handleSort("redeemablePoints")}>Redeemable Points</th>
            <th onClick={() => handleSort("totalRedeemedPoints")}>Redeemed Points</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCustomers.map((customer) => (
            <tr key={customer.customerId}>
              <td>{customer.customerId}</td>
              <td>{customer.name}</td>
              <td>{customer.dob || "N/A"}</td>
              {/* <td>{customer.phone}</td> */}
              <td>{customer.email}</td>
              {/* <td>{customer.address}</td> */}
              <td>{customer.redeemablePoints}</td>
              <td>{customer.totalRedeemedPoints}</td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleShowModal(customer)}>Edit</Button>
                <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(customer.customerId)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination className="mt-3">
        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
        {[...Array(totalPages).keys()].map((number) => (
          <Pagination.Item key={number + 1} active={number + 1 === currentPage} onClick={() => setCurrentPage(number + 1)}>
            {number + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
      </Pagination>

      {/* Modal for Adding/Editing Customers */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{currentCustomer ? "Edit Customer" : "Add Customer"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} />
            </Form.Group>
            <Button variant="primary" type="submit">
              {currentCustomer ? "Update" : "Add"} Customer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Customers;
