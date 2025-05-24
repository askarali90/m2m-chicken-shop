import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesPerDay, setSalesPerDay] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [cashInDrawer, setCashInDrawer] = useState("");


  const [passwordInput, setPasswordInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false); // 🆕

  const correctPassword = "M2M@2024"; // 👉 Your password

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("dashboardAuthenticated");
    if (isAuthenticated === "true") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      axios.get("http://localhost:5000/api/reports/summary")
        .then((res) => {
          setTotalSales(res.data.totalSales);
          setPaymentBreakdown(res.data.paymentBreakdown);
          setTotalCustomers(res.data.totalCustomers);
          setTotalProducts(res.data.totalProducts);
          setSalesPerDay(res.data.salesPerDay);
          setRecentTransactions(res.data.recentTransactions);
        })
        .catch((err) => console.error("Error fetching dashboard data:", err));
    }
  }, [authenticated]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (isUnlocking) return; // prevent multiple clicks

    if (passwordInput === correctPassword) {
      setIsUnlocking(true);
      setTimeout(() => {
        setAuthenticated(true);
        localStorage.setItem("dashboardAuthenticated", "true");
        setIsUnlocking(false);
      }, 1500); // small wait for smooth animation ✨
    } else {
      alert("Incorrect Password. Please try again.");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem("dashboardAuthenticated");
    setPasswordInput("");
  };

  if (!authenticated) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <h2>{isUnlocking ? "Unlocking..." : "Enter Password to Access Dashboard"}</h2>

        {isUnlocking ? (
          <div className="spinner-border text-dark mt-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-3" style={{ width: "300px" }}>
            <input
              type="password"
              className="form-control mb-2"
              placeholder="Enter Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-dark w-100">
              Unlock
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Cards Row */}
      <div className="row mt-3">
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h5>Total Sales</h5>
            <p style={{visibility: 'hidden'}}>₹{totalSales.toFixed(2)}</p>
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
      {/* <h3 className="mt-4">Recent Transactions</h3>
      <ul className="list-group">
        {recentTransactions.map((transaction, index) => (
          <li key={index} className="list-group-item">
            {transaction.customerId} - ₹{transaction.totalAmount.toFixed(2)} on {new Date(transaction.date).toLocaleDateString()}
          </li>
        ))}
      </ul> */}

<h3 className="mt-4">Daily Sales Breakdown</h3>
<table className="table table-bordered">
  <thead>
    <tr>
      <th><label style={{float: "right"}}> Amount</label> Mode of Payment </th>
    </tr>
  </thead>
  <tbody>
  {paymentBreakdown.length > 0 ? (
  <>
    <ul className="list-group mb-3">
      {paymentBreakdown.map((entry, index) => (
        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
          {entry._id || "Unknown"}:
          <span>₹{entry.total.toFixed(2)}</span>
        </li>
      ))}
      <li className="list-group-item d-flex justify-content-between align-items-center bg-light fw-bold">
        Total Sales:
        <span>
          ₹{paymentBreakdown.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
        </span>
      </li>
    </ul>
  </>
) : (
  <p>No payment breakdown available.</p>
)}

  </tbody>
</table>

    <div className="mb-3">
      <label><strong>Cash in Drawer (₹): </strong></label>
      <input
        type="number"
        className="form-control"
        value={cashInDrawer}
        onChange={(e) => setCashInDrawer(e.target.value)}
      />
    </div>

    <div className="alert alert-info">
    {(() => {
      const cashSales = paymentBreakdown
        .filter(entry => (entry._id || "").toLowerCase() === "cash")
        .reduce((acc, curr) => acc + curr.total, 0);

      const cashDrawer = parseFloat(cashInDrawer || 0);
      const difference = cashDrawer - cashSales;

      return (
        <>
          <h3><strong>Expected Cash:</strong> ₹{cashSales.toFixed(2)} </h3>
          <br />
          <h3><strong>Difference:</strong> ₹{difference.toFixed(2)} </h3>
        </>
      );
    })()}

    </div>


    </div>
  );
};

export default Dashboard;
