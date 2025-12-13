import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Table, Pagination, Form, Button, Row, Col } from "react-bootstrap";
import * as XLSX from "xlsx";

const Reports = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const buttonRef = useRef(null);

  const fetchAllBills = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/checkout");
      setBills(res.data);
      setFilteredBills(res.data);
      triggerClick();
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  useEffect(() => {
    fetchAllBills();
  }, []);

  const triggerClick = () => {
    buttonRef.current.click();
  };

  const filterByDate = (from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // Include full day
    const filtered = bills.filter((bill) => {
      const billDate = new Date(bill.date);
      return billDate >= fromDate && billDate <= toDate;
    });
    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  const handleSearchCustomerId = () => {
    const filtered = bills.filter((bill) =>
      bill.customerId.toLowerCase().includes(searchCustomerId.toLowerCase())
    );
    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  const handleRangeFilter = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days + 1);
    filterByDate(from, to);
  };

  const handleToday = () => {
    const today = new Date();
    filterByDate(today.setHours(0, 0, 0, 0), today.setHours(23, 59, 59, 999));
  };

  const handleCustomDate = () => {
    if (dateRange.from && dateRange.to) {
      filterByDate(dateRange.from, dateRange.to);
    } else {
      alert("Please select both From and To dates.");
    }
  };

  const handleShowAll = () => {
    setFilteredBills(bills);
    setCurrentPage(1);
  };

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

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredBills);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Reports");
    XLSX.writeFile(workbook, "Sales_Reports.xlsx");
  };

  const indexOfLastBill = currentPage * itemsPerPage;
  const indexOfFirstBill = indexOfLastBill - itemsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  return (
    <div className="container-fluid mt-4">
      <h2>Sales Reports</h2>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={7}>
          <Button className="m-2" variant="dark" ref={buttonRef} onClick={handleToday}>Today</Button>
        
          <Button className="m-2" variant="dark" onClick={() => handleRangeFilter(7)}>Last 7 Days</Button>
        
          <Button className="m-2" variant="dark" onClick={() => handleRangeFilter(30)}>1 Month</Button>
        
          <Button className="m-2" variant="dark" onClick={() => handleRangeFilter(90)}>3 Months</Button>
        
          <Button className="m-2" variant="dark" onClick={handleShowAll}>Show All</Button>
        </Col>        
        <Col md={5}>
          <div style={{display: 'flex'}}>
            <label className="mt-3">From: </label>
            <Form.Control
              type="date"
              className="m-2"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <label className="mt-3">To: </label>        
            <Form.Control
              type="date"
              className="m-2"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />        
            <Button className="m-2" variant="primary" onClick={handleCustomDate}>Filter</Button>
          </div>          
        </Col>
      </Row>

      {/* Custom Date Range */}
      <Row className="mb-3">
        
        <Col md={7}>
          <Form inline="true" className="d-flex">
            <Form.Control
              type="text"
              placeholder="Search by Customer ID"
              value={searchCustomerId}
              onChange={(e) => setSearchCustomerId(e.target.value)}
            />
            <Button variant="primary" className="ms-2" onClick={handleSearchCustomerId}>Search</Button>
          </Form>
        </Col>
        <Col md={5} className="d-flex justify-content-end">
          <Button variant="dark" onClick={exportToExcel}>Export to Excel</Button>
        </Col>
      </Row>

      {/* Reports Table */}
      <Table striped bordered hover>
        <thead className="table-dark">
          <tr>
          <th onClick={() => handleSort("_id")} style={{ cursor: "pointer" }}>Bill ID</th>
            <th onClick={() => handleSort("customerId")} style={{ cursor: "pointer" }}>Customer ID</th>
            <th onClick={() => handleSort("totalAmount")} style={{ cursor: "pointer" }}>Total Amount</th>
            <th onClick={() => handleSort("earnedPoints")} style={{ cursor: "pointer" }}>Earned Points</th>
            <th onClick={() => handleSort("kgsAccumulated")} style={{ cursor: "pointer" }}>Purchased KGs</th>
            <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>Date</th>
            <th onClick={() => handleSort("modeOfPayment")} style={{ cursor: "pointer" }}>Payment Mode</th>
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
                <td>{bill.kgsAccumulated.toFixed(2)}</td>
                <td>{new Date(bill.date).toLocaleString()}</td>
                <td>{bill.modeOfPayment}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">No sales records found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      <div style={{overflow: 'auto'}}>
      <Pagination className="justify-content-center">
        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
        {[...Array(totalPages)].map((_, index) => (
          <Pagination.Item
            key={index}
            active={index + 1 === currentPage}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
      </Pagination>
      </div>
    </div>
  );
};

export default Reports;
