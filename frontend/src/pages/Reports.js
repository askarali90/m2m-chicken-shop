import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Pagination } from "react-bootstrap";

const Reports = () => {
  const [bills, setBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch bills from API
  useEffect(() => {
    axios.get("http://localhost:5000/api/checkout") // ✅ Corrected API endpoint
      .then((res) => setBills(res.data))
      .catch((err) => console.error("Error fetching bills:", err));
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
    const sortedData = [...bills].sort((a, b) => {
      if (a[field] < b[field]) return order === "asc" ? -1 : 1;
      if (a[field] > b[field]) return order === "asc" ? 1 : -1;
      return 0;
    });
    setBills(sortedData);
  };

  // Pagination Logic
  const indexOfLastBill = currentPage * itemsPerPage;
  const indexOfFirstBill = indexOfLastBill - itemsPerPage;
  const currentBills = bills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(bills.length / itemsPerPage);

  return (
    <div className="container-fluid mt-4">
      <h2>Sales Reports</h2>
      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th onClick={() => handleSort("_id")} style={{ cursor: "pointer" }}>Bill ID</th>
            <th onClick={() => handleSort("customerId")} style={{ cursor: "pointer" }}>Customer ID</th>
            <th onClick={() => handleSort("totalAmount")} style={{ cursor: "pointer" }}>Total Amount</th>
            <th onClick={() => handleSort("earnedPoints")} style={{ cursor: "pointer" }}>Earned Points</th>
            <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentBills.length > 0 ? (
            currentBills.map((bill) => (
              <tr key={bill._id}>
                <td>{bill._id}</td>
                <td>{bill.customerId}</td>
                <td>₹{bill.totalAmount.toFixed(2)}</td>
                <td>{bill.earnedPoints.toFixed(2)}</td>
                <td>{new Date(bill.date).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">No sales records found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Pagination Controls */}
      <Pagination className="justify-content-center">
        <Pagination.Prev 
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1} 
        />
        {[...Array(totalPages)].map((_, index) => (
          <Pagination.Item 
            key={index} 
            active={index + 1 === currentPage} 
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next 
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages} 
        />
      </Pagination>
    </div>
  );
};

export default Reports;
