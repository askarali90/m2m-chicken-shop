import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Membership from "./pages/Membership";
import Reports from "./pages/Reports";
import "./App.css"; // Ensure styling is added

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Router>
      <div className={`app-container ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        <Navbar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        <div className="content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
