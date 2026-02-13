import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Pagination, Form, Button, Row, Col } from "react-bootstrap";
import * as XLSX from "xlsx";

const CreditBilling = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // inline edit state for balance
  const [editingId, setEditingId] = useState(null);
  const [editingBalance, setEditingBalance] = useState("");

  // sorting state
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  // pagination for paid transactions
  const [paidCurrentPage, setPaidCurrentPage] = useState(1);
  const paidItemsPerPage = 10;

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  // fetch all credit transactions with their settlement balances
  const fetchAllTransactions = async () => {
    try {
      const billRes = await axios.get("http://localhost:5000/api/checkout");
      const creditBills = billRes.data.filter((t) => (t.modeOfPayment || "").toLowerCase() === "credit");

      const settledRes = await axios.get("http://localhost:5000/api/credit-settlements");
      const settledMap = {}; // map billId -> latest settlement with balance

      (settledRes.data || []).forEach((s) => {
        const id = String(s.billId);
        const sDate = s.date ? new Date(s.date) : new Date(0);
        if (!settledMap[id] || new Date(settledMap[id].date) < sDate) {
          settledMap[id] = s;
        }
      });

      // merge bills with settlements
      const merged = creditBills.map((bill) => {
        const latest = settledMap[String(bill._id)];
        const totalAmount = bill.totalAmount || 0;
        const balance = latest ? (latest.balance || 0) : totalAmount;
        const amountPaid = totalAmount - balance;
        return {
          billId: bill._id,
          customerId: bill.customerId,
          totalAmount: totalAmount,
          earnedPoints: bill.earnedPoints || 0,
          kgsAccumulated: bill.kgsAccumulated || 0,
          date: bill.date,
          modeOfPayment: bill.modeOfPayment,
          balance: balance,
          amountPaid: amountPaid,
        };
      });

      setAllTransactions(merged);
      setFilteredTransactions(merged.sort(sortByKey(merged, "date", "desc")));
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const sortByKey = (arr, key, direction = "asc") => {
    return (a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (key === "date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (direction === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    };
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...filteredTransactions].sort(sortByKey(filteredTransactions, key, direction));
    setFilteredTransactions(sorted);
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  const filterByDate = (from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    const filtered = allTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= fromDate && tDate <= toDate;
    });
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleRangeFilter = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days + 1);
    filterByDate(from.toISOString(), to.toISOString());
  };

  const handleToday = () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date().toISOString();
    filterByDate(start, end);
  };

  const handleCustomDate = () => {
    if (dateRange.from && dateRange.to) {
      filterByDate(dateRange.from, dateRange.to);
    } else {
      alert("Please select both From and To dates.");
    }
  };

  const handleSearchCustomerId = () => {
    const value = searchCustomerId.trim().toLowerCase();
    if (!value) {
      setFilteredTransactions(allTransactions);
      return;
    }
    const filtered = allTransactions.filter((t) =>
      (t.customerId || "").toLowerCase().includes(value)
    );
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setFilteredTransactions(allTransactions);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Transactions");
    XLSX.writeFile(workbook, "Credit_Transactions.xlsx");
  };

  const handleEditBalance = (transaction) => {
    setEditingId(transaction.billId);
    setEditingBalance(""); // Start with empty field for amount paid
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingBalance("");
  };

  const handleSaveBalance = async (transaction) => {
    const amountPaid = parseFloat(editingBalance);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      alert("Enter a valid positive amount paid.");
      return;
    }
    const newBalance = Math.max(0, transaction.balance - amountPaid);
    try {
      await axios.post("http://localhost:5000/api/credit-settlements", {
        settlements: [{
          billId: transaction.billId,
          customerId: transaction.customerId,
          settledAmount: amountPaid,
          originalTotal: transaction.totalAmount,
          balance: newBalance,
          date: new Date().toISOString(),
        }]
      });
      await fetchAllTransactions();
      handleCancelEdit();
      alert("Balance updated successfully.");
    } catch (err) {
      console.error("Error updating balance:", err);
      alert("Failed to update balance.");
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTransactions = filteredTransactions.filter((t) => t.balance > 0).slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.filter((t) => t.balance > 0).length / itemsPerPage));

  // paid transactions (balance = 0)
  const paidTransactions = filteredTransactions.filter((t) => t.balance === 0);
  const paidIndexOfLast = paidCurrentPage * paidItemsPerPage;
  const paidIndexOfFirst = paidIndexOfLast - paidItemsPerPage;
  const currentPaidTransactions = paidTransactions.slice(paidIndexOfFirst, paidIndexOfLast);
  const paidTotalPages = Math.max(1, Math.ceil(paidTransactions.length / paidItemsPerPage));

  return (
    <div className="container-fluid mt-4">
      <h3>Credit Transactions</h3>

      <Row className="mb-3">
        <Col md={7}>
          <Button className="m-2" variant="dark" onClick={handleToday}>Today</Button>
          <Button className="m-2" variant="dark" onClick={() => handleRangeFilter(7)}>Last 7 Days</Button>
          <Button className="m-2" variant="dark" onClick={() => handleRangeFilter(30)}>1 Month</Button>
          <Button className="m-2" variant="dark" onClick={() => handleRangeFilter(90)}>3 Months</Button>
          <Button className="m-2" variant="dark" onClick={handleShowAll}>Show All</Button>
        </Col>
        <Col md={5}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", height: "38px" }}>
            <Form.Control
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <Form.Control
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
            <Button variant="primary" onClick={handleCustomDate}>Filter</Button>
            <Button variant="dark" onClick={exportToExcel}>Export to Excel</Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={8}>
          <Form className="d-flex">
            <Form.Control
              type="text"
              placeholder="Search by Customer ID"
              value={searchCustomerId}
              onChange={(e) => setSearchCustomerId(e.target.value)}
            />
            <Button variant="primary" className="ms-2" onClick={handleSearchCustomerId}>Search</Button>
          </Form>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("billId")}>Bill ID{getSortIndicator("billId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("customerId")}>Customer ID{getSortIndicator("customerId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("totalAmount")}>Total Amount{getSortIndicator("totalAmount")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("amountPaid")}>Amount Paid{getSortIndicator("amountPaid")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("balance")}>Balance{getSortIndicator("balance")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("earnedPoints")}>Earned Points{getSortIndicator("earnedPoints")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("kgsAccumulated")}>Purchased KGs{getSortIndicator("kgsAccumulated")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("date")}>Date{getSortIndicator("date")}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.length > 0 ? (
            currentTransactions.map((t) => (
              <tr key={t.billId}>
                <td>{t.billId}</td>
                <td>{t.customerId}</td>
                <td>₹{(t.totalAmount || 0).toFixed(2)}</td>
                <td>₹{(t.amountPaid || 0).toFixed(2)}</td>
                <td>
                  {editingId === t.billId ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingBalance}
                        onChange={(e) => setEditingBalance(e.target.value)}
                        style={{ width: "120px" }}
                      />
                      <Button size="sm" variant="success" onClick={() => handleSaveBalance(t)}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
                    </div>
                  ) : (
                    <span>₹{(t.balance || 0).toFixed(2)}</span>
                  )}
                </td>
                <td>{(t.earnedPoints || 0).toFixed(2)}</td>
                <td>{(t.kgsAccumulated || 0).toFixed(2)}</td>
                <td>{t.date ? new Date(t.date).toLocaleString() : "-"}</td>
                <td>
                  {editingId !== t.billId && t.balance > 0 && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditBalance(t)}
                    >
                      ✎ Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No credit transactions found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination className="justify-content-center">
        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
        {[...Array(totalPages)].map((_, idx) => (
          <Pagination.Item key={idx} active={idx + 1 === currentPage} onClick={() => setCurrentPage(idx + 1)}>
            {idx + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
      </Pagination>

      <Row className="mb-3 mt-5">
        <h3>Credit Paid Details</h3>
      </Row>

      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("billId")}>Bill ID{getSortIndicator("billId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("customerId")}>Customer ID{getSortIndicator("customerId")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("totalAmount")}>Total Amount{getSortIndicator("totalAmount")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("amountPaid")}>Amount Paid{getSortIndicator("amountPaid")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("earnedPoints")}>Earned Points{getSortIndicator("earnedPoints")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("kgsAccumulated")}>Purchased KGs{getSortIndicator("kgsAccumulated")}</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("date")}>Date{getSortIndicator("date")}</th>
          </tr>
        </thead>
        <tbody>
          {currentPaidTransactions.length > 0 ? (
            currentPaidTransactions.map((t) => (
              <tr key={t.billId}>
                <td>{t.billId}</td>
                <td>{t.customerId}</td>
                <td>₹{(t.totalAmount || 0).toFixed(2)}</td>
                <td>₹{(t.amountPaid || 0).toFixed(2)}</td>
                <td>{(t.earnedPoints || 0).toFixed(2)}</td>
                <td>{(t.kgsAccumulated || 0).toFixed(2)}</td>
                <td>{t.date ? new Date(t.date).toLocaleString() : "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">No paid transactions found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination className="justify-content-center mb-4">
        <Pagination.Prev onClick={() => setPaidCurrentPage(prev => Math.max(prev - 1, 1))} disabled={paidCurrentPage === 1} />
        {[...Array(paidTotalPages)].map((_, idx) => (
          <Pagination.Item key={idx} active={idx + 1 === paidCurrentPage} onClick={() => setPaidCurrentPage(idx + 1)}>
            {idx + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => setPaidCurrentPage(prev => Math.min(prev + 1, paidTotalPages))} disabled={paidCurrentPage === paidTotalPages} />
      </Pagination>
    </div>
  );
};

export default CreditBilling;
