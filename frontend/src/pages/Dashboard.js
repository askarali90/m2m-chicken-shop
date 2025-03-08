import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesPerDay, setSalesPerDay] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/reports/summary")
      .then((res) => {
        setTotalSales(res.data.totalSales);
        setTotalCustomers(res.data.totalCustomers);
        setTotalProducts(res.data.totalProducts);
        setSalesPerDay(res.data.salesPerDay);
        setRecentTransactions(res.data.recentTransactions);
      })
      .catch((err) => console.error("Error fetching dashboard data:", err));
  }, []);

  return (
    <div className="container-fluid mt-4">
      <h2>Dashboard</h2>

      {/* Cards Row */}
      <div className="row">
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h5>Total Sales</h5>
            <p>₹{totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h5>Total Customers</h5>
            <p>{totalCustomers}</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h5>Total Products</h5>
            <p>{totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Sales Per Day Table */}
      <h3 className="mt-4">Sales Per Day</h3>
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Total Sales</th>
          </tr>
        </thead>
        <tbody>
          {salesPerDay.length > 0 ? (
            salesPerDay.map((sale, index) => (
              <tr key={index}>
                <td>{sale._id}</td>
                <td>₹{sale.totalSales.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center">No sales records found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Recent Transactions */}
      <h3 className="mt-4">Recent Transactions</h3>
      <ul className="list-group">
        {recentTransactions.map((transaction, index) => (
          <li key={index} className="list-group-item">
            {transaction.customerId} - ₹{transaction.totalAmount.toFixed(2)} on {new Date(transaction.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
