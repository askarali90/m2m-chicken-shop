 import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Pagination, Form, Button, Row, Col } from "react-bootstrap";
import * as XLSX from "xlsx";

const CreditBilling = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // new state: map of selected bills -> { settledAmount }
  const [selectedMap, setSelectedMap] = useState({}); // { [billId]: { bill, settledAmount } }
  const [settledTransactions, setSettledTransactions] = useState([]);
  // pagination for settled transactions (client-side)
  const [settledCurrentPage, setSettledCurrentPage] = useState(1);
  const settledItemsPerPage = 5; // change page size here if needed
// ...existing code...

  const [unsettledTransactions, setUnsettledTransactions] = useState([]);
  const [unsettledCurrentPage, setUnsettledCurrentPage] = useState(1);
  const unsettledItemsPerPage = 5;

  useEffect(() => {
    fetchCreditTransactions();
    fetchSettledTransactions();
  }, []);
// ...existing code...
  useEffect(() => {
    // build map of latest settlement per billId (by date) so we can check final balance
    const latestByBill = {};
    (settledTransactions || []).forEach((s) => {
      const id = String(s.billId);
      const sDate = s.date ? new Date(s.date) : new Date(0);
      if (!latestByBill[id] || new Date(latestByBill[id].date) < sDate) {
        latestByBill[id] = s;
      }
    });

    // unsettled = bills that either have no settlement OR whose latest settlement balance > 0
    const unsettled = (bills || []).filter((b) => {
      const id = String(b._id);
      const latest = latestByBill[id];
      if (!latest) return true; // no settlement at all
      const balance = Number(latest.balance || 0);
      return balance > 0; // still outstanding
    });

    setUnsettledTransactions(unsettled);
    setUnsettledCurrentPage(1);
   }, [bills, settledTransactions]);
// ...existing

  const fetchCreditTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/checkout");
      // filter transactions where modeOfPayment is Credit
      const creditTx = res.data.filter((t) => (t.modeOfPayment || "").toLowerCase() === "credit");
      setBills(creditTx);
      setFilteredBills(creditTx);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching credit transactions:", err);
    }
  };

  // fetch settled transactions to display in "Settled Credit Transactions" table
  const fetchSettledTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/credit-settlements"); // ensure backend route exists
      setSettledTransactions(res.data || []);
    } catch (err) {
      console.error("Error fetching settled transactions:", err);
    }
  };

  const filterByDate = (from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    const filtered = bills.filter((bill) => {
      const billDate = new Date(bill.date);
      return billDate >= fromDate && billDate <= toDate;
    });
    setFilteredBills(filtered);
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
      setFilteredBills(bills);
      return;
    }
    const filtered = bills.filter((bill) =>
      (bill.customerId || "").toLowerCase().includes(value)
    );
    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  const handleShowAll = () => {
    setFilteredBills(bills);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredBills);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Transactions");
    XLSX.writeFile(workbook, "Credit_Transactions.xlsx");
  };

  // toggle select a bill for settlement
  const toggleSelectBill = (bill) => {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (copy[bill._id]) {
        delete copy[bill._id];
      } else {
        copy[bill._id] = { bill, settledAmount: bill.totalAmount || 0 };
      }
      return copy;
    });
  };

  const handleSettledAmountChange = (billId, value) => {
    // allow empty string for input but store numeric as parseFloat
    const num = value === "" ? "" : parseFloat(value);
    setSelectedMap((prev) => ({
      ...prev,
      [billId]: { ...prev[billId], settledAmount: num },
    }));
  };

  // Save selected settlements to backend
  const saveSettlements = async () => {
    const entries = Object.values(selectedMap);
    if (entries.length === 0) {
      alert("Select at least one bill to settle.");
      return;
    }

    // basic validation
    for (const e of entries) {
      const amt = parseFloat(e.settledAmount) || 0;
      if (amt <= 0) {
        alert("Settled amount must be greater than 0 for selected bills.");
        return;
      }
    }

    const payload = entries.map((e) => ({
      billId: e.bill._id,
      customerId: e.bill.customerId,
      settledAmount: parseFloat(e.settledAmount),
      date: new Date().toISOString(),
      originalTotal: e.bill.totalAmount || 0,
    }));

    try {
      await axios.post("http://localhost:5000/api/credit-settlements", { settlements: payload });
      // refresh lists
      await fetchSettledTransactions();
      await fetchCreditTransactions();
      setSelectedMap({});
      alert("Settlements saved.");
    } catch (err) {
      console.error("Error saving settlements:", err);
      alert(err.response?.data?.message || "Failed to save settlements.");
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentBills = filteredBills.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredBills.length / itemsPerPage));

  // settled transactions pagination calculations
  const settledIndexOfLast = settledCurrentPage * settledItemsPerPage;
  const settledIndexOfFirst = settledIndexOfLast - settledItemsPerPage;
  const currentSettled = settledTransactions.slice(settledIndexOfFirst, settledIndexOfLast);
  const settledTotalPages = Math.max(1, Math.ceil(settledTransactions.length / settledItemsPerPage));

  // unsettled transactions pagination calculations
  const unsettledIndexOfLast = unsettledCurrentPage * unsettledItemsPerPage;
  const unsettledIndexOfFirst = unsettledIndexOfLast - unsettledItemsPerPage;
  const currentUnsettled = unsettledTransactions.slice(unsettledIndexOfFirst, unsettledIndexOfLast);
  const unsettledTotalPages = Math.max(1, Math.ceil(unsettledTransactions.length / unsettledItemsPerPage));


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
            <th>Select</th>
            <th>Bill ID</th>
            <th>Customer ID</th>
            <th>Total Amount</th>
            <th>Earned Points</th>
            <th>Purchased KGs</th>
            <th>Date</th>
            <th>Payment Mode</th>
            <th>Settled Amount</th>
          </tr>
        </thead>
        <tbody>
          {currentBills.length > 0 ? (
            currentBills.map((bill) => {
              const selected = !!selectedMap[bill._id];
              return (
                <tr key={bill._id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelectBill(bill)}
                    />
                  </td>
                  <td>{bill._id}</td>
                  <td>{bill.customerId}</td>
                  <td>₹{(bill.totalAmount || 0).toFixed(2)}</td>
                  <td>{(bill.earnedPoints || 0).toFixed(2)}</td>
                  <td>{(bill.kgsAccumulated || 0).toFixed(2)}</td>
                  <td>{bill.date ? new Date(bill.date).toLocaleString() : "-"}</td>
                  <td>{bill.modeOfPayment}</td>
                  <td style={{ minWidth: 140 }}>
                    {selected ? (
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={selectedMap[bill._id].settledAmount === "" ? "" : selectedMap[bill._id].settledAmount}
                        onChange={(e) => handleSettledAmountChange(bill._id, e.target.value)}
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No credit transactions found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="d-flex justify-content-end mb-3">
        <Button variant="success" onClick={saveSettlements}>Save Settlements</Button>
      </div>

      <Pagination className="justify-content-center">
        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
        {[...Array(totalPages)].map((_, idx) => (
          <Pagination.Item key={idx} active={idx + 1 === currentPage} onClick={() => setCurrentPage(idx + 1)}>
            {idx + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
      </Pagination>

      <Row className="mb-3 mt-4">
        <h3>Settled Credit Transactions</h3>
      </Row>

      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>Settlement ID</th>
            <th>Bill ID</th>
            <th>Customer ID</th>
            <th>Settled Amount</th>
            <th>Original Total</th>
            <th>Balance</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentSettled.length > 0 ? (
            currentSettled.map((s) => (
              <tr key={s._id || `${s.billId}-${s.date}`}>
                <td>{s._id || "-"}</td>
                <td>{s.billId}</td>
                <td>{s.customerId}</td>
                <td>₹{(s.settledAmount || 0).toFixed(2)}</td>
                <td>₹{(s.originalTotal || 0).toFixed(2)}</td>
                <td>₹{(s.balance || 0).toFixed(2)}</td>
                <td>{s.date ? new Date(s.date).toLocaleString() : "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">No settled transactions found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination className="justify-content-center">
        <Pagination.Prev
          onClick={() => setSettledCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={settledCurrentPage === 1}
        />
        {[...Array(settledTotalPages)].map((_, idx) => (
          <Pagination.Item
            key={idx}
            active={idx + 1 === settledCurrentPage}
            onClick={() => setSettledCurrentPage(idx + 1)}
          >
            {idx + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => setSettledCurrentPage(prev => Math.min(prev + 1, settledTotalPages))}
          disabled={settledCurrentPage === settledTotalPages}
        />
      </Pagination>

      <Row className="mb-3 mt-4">
        <h3>Unsettled Credit Transactions</h3>
      </Row>

      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
            <th>Bill ID</th>
            <th>Customer ID</th>
            <th>Total Amount</th>
            <th>Earned Points</th>
            <th>Purchased KGs</th>
            <th>Date</th>
            <th>Payment Mode</th>
          </tr>
        </thead>
        <tbody>
          {currentUnsettled.length > 0 ? (
            currentUnsettled.map((bill) => (
              <tr key={bill._id}>
                <td>{bill._id}</td>
                <td>{bill.customerId}</td>
                <td>₹{(bill.totalAmount || 0).toFixed(2)}</td>
                <td>{(bill.earnedPoints || 0).toFixed(2)}</td>
                <td>{(bill.kgsAccumulated || 0).toFixed(2)}</td>
                <td>{bill.date ? new Date(bill.date).toLocaleString() : "-"}</td>
                <td>{bill.modeOfPayment}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">No unsettled transactions found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination className="justify-content-center mb-4">
        <Pagination.Prev
          onClick={() => setUnsettledCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={unsettledCurrentPage === 1}
        />
        {[...Array(unsettledTotalPages)].map((_, idx) => (
          <Pagination.Item
            key={idx}
            active={idx + 1 === unsettledCurrentPage}
            onClick={() => setUnsettledCurrentPage(idx + 1)}
          >
            {idx + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => setUnsettledCurrentPage(prev => Math.min(prev + 1, unsettledTotalPages))}
          disabled={unsettledCurrentPage === unsettledTotalPages}
        />
      </Pagination>

    </div>
  );
};

export default CreditBilling;
