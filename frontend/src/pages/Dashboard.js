import React, { useState, useEffect } from "react";
import { Pagination } from "react-bootstrap";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesPerDay, setSalesPerDay] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [cashInDrawer, setCashInDrawer] = useState("");
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const salesItemsPerPage = 5; // show 10 rows per page
  const [todaySales, setTodaySales] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

  const paginatedSalesPerDay = salesPerDay.slice(
    (salesCurrentPage - 1) * salesItemsPerPage,
    salesCurrentPage * salesItemsPerPage
  );

  const totalSalesPages = Math.ceil(salesPerDay.length / salesItemsPerPage);

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem("dashboardAuthenticated");
    setPasswordInput("");
  };

  const handleSaveTodaySales = async () => {
    try {
      const cashSales = paymentBreakdown
        .filter(entry => (entry._id || "").toLowerCase() === "cash")
        .reduce((acc, curr) => acc + curr.total, 0);

      const cardSales = paymentBreakdown
        .filter(entry => (entry._id || "").toLowerCase() === "card")
        .reduce((acc, curr) => acc + curr.total, 0);

      const upiSales = paymentBreakdown
        .filter(entry => (entry._id || "").toLowerCase() === "upi")
        .reduce((acc, curr) => acc + curr.total, 0);

      const creditSales = paymentBreakdown
        .filter(entry => (entry._id || "").toLowerCase() === "credit")
        .reduce((acc, curr) => acc + curr.total, 0);

      const totalSales = paymentBreakdown.reduce((acc, curr) => acc + curr.total, 0);
      const cashDrawer = parseFloat(cashInDrawer || 0);
      const difference = cashDrawer - cashSales;

      await axios.post("http://localhost:5000/api/reports/save-today", {
        date: new Date(),
        totalSales,
        cashSales,
        cardSales,
        upiSales,
        creditSales,
        cashInDrawer: cashDrawer,
        difference
      });

      alert("Today's sales saved successfully!");
    } catch (err) {
      console.error("Error saving today’s sales:", err);
      alert("Failed to save today’s sales.");
    }
  };

  const handleButtonClick = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await axios.get(`http://localhost:5000/api/reports/today-sales?date=${today}`);
      setTodaySales(Array.isArray(res.data) ? res.data : []); // ✅ Ensure it's an array
      setShowTable(true);
    } catch (err) {
      console.error("Error fetching today's sales:", err);
    }
  };

   const fetchSales = async (pageNum = 1) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await axios.get(`http://localhost:5000/api/reports/today-sales?date=${today}&page=${pageNum}&limit=5`);

      if (res.data && Array.isArray(res.data.data)) {
        setSalesData(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.currentPage || 1);
        setShowTable(true);
      } else {
        setSalesData([]);
        setShowTable(true);
      }
    } catch (err) {
      console.error("Error fetching today's sales:", err);
      setSalesData([]);
      setShowTable(true);
    }
  };


  useEffect(() => {
    if (showTable) fetchSales(page);
  }, [page]);

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
      <table className="table table-bordered table-striped" id="salesPerDayTable">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Total Sales</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSalesPerDay.length > 0 ? (
            paginatedSalesPerDay.map((sale, index) => (
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

      <Pagination className="mt-3">
        <Pagination.Prev
          onClick={() => setSalesCurrentPage(salesCurrentPage - 1)}
          disabled={salesCurrentPage === 1}
        />
        {[...Array(totalSalesPages).keys()].map((number) => (
          <Pagination.Item
            key={number + 1}
            active={number + 1 === salesCurrentPage}
            onClick={() => setSalesCurrentPage(number + 1)}
          >
            {number + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => setSalesCurrentPage(salesCurrentPage + 1)}
          disabled={salesCurrentPage === totalSalesPages}
        />
      </Pagination>

      {/* Recent Transactions */}
      {/* <h3 className="mt-4">Recent Transactions</h3>
      <ul className="list-group">
        {recentTransactions.map((transaction, index) => (
          <li key={index} className="list-group-item">
            {transaction.customerId} - ₹{transaction.totalAmount.toFixed(2)} on {new Date(transaction.date).toLocaleDateString()}
          </li>
        ))}
      </ul> */}
    <div style={{border: "2px solid black", padding: "20px", marginTop: "30px", borderRadius: "10px"}}>
      <h3 className="mt-4 mb-4 text-center">Today Sales Breakdown</h3>
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

        const creditSales = paymentBreakdown
          .filter(entry => (entry._id || "").toLowerCase() === "credit")
          .reduce((acc, curr) => acc + curr.total, 0);

        const cashDrawer = parseFloat(cashInDrawer || 0);
        const difference = cashDrawer - cashSales;

        return (
          <>
            <h3><strong>Expected Cash:</strong> ₹{cashSales.toFixed(2)} </h3>
            <br />
            <h3><strong>Difference:</strong> ₹{difference.toFixed(2)} </h3>
            <br />
            <h3><strong>Total Credit:</strong> ₹{creditSales.toFixed(2)} </h3>
          </>
        );
      })()}

      </div>
      <div className="text-center mt-3">
        <button className="btn btn-dark px-5 py-2" onClick={handleSaveTodaySales}>
          Save Today’s Sales
        </button>        
      </div>

      <div className="mt-4">
      <button className="btn btn-primary" onClick={() => fetchSales(1)}>
        Show Today Sales
      </button>

      {showTable && Array.isArray(salesData) && salesData.length > 0 && (
        <>
          <table className="table table-bordered table-striped mt-3">
            <thead className="table-dark">
              <tr>
                <th>Date & Time</th>
                <th>Total Sales</th>
                <th>Cash</th>
                <th>Card</th>
                <th>UPI</th>
                <th>Credit</th>
                <th>Cash in Drawer</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((entry, index) => (
                <tr key={index}>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                  <td>₹{entry.totalSales.toFixed(2)}</td>
                  <td>₹{entry.cashSales.toFixed(2)}</td>
                  <td>₹{entry.cardSales.toFixed(2)}</td>
                  <td>₹{entry.upiSales.toFixed(2)}</td>
                  <td>₹{entry.creditSales.toFixed(2)}</td>
                  <td>₹{entry.cashInDrawer.toFixed(2)}</td>
                  <td>₹{entry.difference.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              className="btn btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  

    </div>
  </div>
  );
};

export default Dashboard;
