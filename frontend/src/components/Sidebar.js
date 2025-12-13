import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css"; 

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <h4 className={`sidebar-title ${isCollapsed ? "hidden" : ""}`}>
        <img src="/images/m2m_logo_card.png" />
      </h4>
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link className="nav-link text-white" to="/dashboard">
            <i className="bi bi-house"></i> <span className={isCollapsed ? "hidden" : ""}>Dashboard</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/inventory">
            <i className="bi bi-box-seam"></i> <span className={isCollapsed ? "hidden" : ""}>Inventory</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/products">
            <i className="bi bi-box-seam"></i> <span className={isCollapsed ? "hidden" : ""}>Products</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/customers">
            <i className="bi bi-people"></i> <span className={isCollapsed ? "hidden" : ""}>Customers</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/billing">
            <i className="bi bi-receipt"></i> <span className={isCollapsed ? "hidden" : ""}>Billing POS</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/credit-billing">
            <i className="bi bi-receipt"></i> <span className={isCollapsed ? "hidden" : ""}>Credit Billing</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/membership">
            <i className="bi bi-card-list"></i> <span className={isCollapsed ? "hidden" : ""}>Membership</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link text-white" to="/reports">
            <i className="bi bi-graph-up"></i> <span className={isCollapsed ? "hidden" : ""}>Reports</span>
          </Link>
        </li>
      </ul>
      {/* <button className="toggle-btn" onClick={toggleSidebar}>
        {isCollapsed ? "☰" : "✖"}
      </button> */}
    </div>
  );
};

export default Sidebar;
