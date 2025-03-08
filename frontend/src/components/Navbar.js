import React from "react";
import "./Navbar.css";

const Navbar = ({ isCollapsed, toggleSidebar }) => {
  return (
    <nav className={`top-navbar ${isCollapsed ? "collapsed" : ""}`}>
      <button className="menu-btn" onClick={toggleSidebar}>☰</button>
      <h3>M2M Chicken Shop</h3>
      <div className="profile-section">
        <i className="bi bi-people"></i>
        <span> &nbsp;Administrator</span>
      </div>
    </nav>
  );
};

export default Navbar;
