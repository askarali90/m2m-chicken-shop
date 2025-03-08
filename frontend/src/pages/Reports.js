import React, { useState, useEffect } from "react";
import axios from "axios";

const Reports = () => {
  const [bills, setBills] = useState([]);

  // Fetch bills from API
  useEffect(() => {
    axios.get("http://localhost:5000/api/checkout") // ✅ Corrected API endpoint
      .then((res) => setBills(res.data))
      .catch((err) => console.error("Error fetching bills:", err));
  }, []);
  

  return (
    <div className="container-fluid mt-4">
      <h2>Sales Reports</h2>
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Bill ID</th>
            <th>Customer ID</th>
            <th>Total Amount</th>
            <th>Earned Points</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {bills.length > 0 ? (
            bills.map((bill) => (
              <tr key={bill._id}>
                <td>{bill._id}</td>
                <td>{bill.customerId}</td>
                <td>₹{bill.totalAmount.toFixed(2)}</td>
                <td>{bill.earnedPoints}</td>
                <td>{new Date(bill.date).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">No sales records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;
