import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
// import { GraphIcon } from '@primer/octicons-react'
// import { PlusCircleIcon } from '@primer/octicons-react'
// import { ListUnorderedIcon } from '@primer/octicons-react'
// import { ReportIcon } from '@primer/octicons-react'
// import { ShieldCheckIcon } from '@primer/octicons-react'
// import { FileDirectoryIcon } from '@primer/octicons-react'
// import { LocationIcon } from '@primer/octicons-react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight } from "@fortawesome/free-solid-svg-icons";
// import logo from '../assets/logo.png';
import sidebarLogo from "../assets/sidebar-logo.jpg";
import '../styles/sidebar.css'

interface SideBarProps {
  collapsed?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ collapsed = false }) => {
  const [search, setSearch] = useState("");

  // Sidebar menu items
  const menuItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/request-management", label: "Request Management" },
    { to: "/receive-items", label: "Receive Items" },
    { to: "/sterilization-process", label: "Sterilization Process" },
    { to: "/issue-item", label: "Issue Item" },
    { to: "/stock-management", label: "Stock Management" },
    { to: "/consumption-reports", label: "Consumption Reports" },
  ];

  // Filter menu items by search
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-content">
        <div className="sidebar-top">
          <a
            href=""
            className={`sidebar-profile ${collapsed ? "collapsed" : ""}`}
          >
            <img src={sidebarLogo} alt="" />
          </a>
          <div className="sidebar-text">
            <h6 className="sidebar-heading">System Admin</h6>
            <h4 className="sidebar-para">HODO Hospital,</h4>
            <p className="sidebar-para">Kazhakkottam</p>
            <p className="sidebar-para2">System Admin</p>
          </div>
        </div>
        <div className={`searchbar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-date">
            <h6 className="sidebar-date-heading">
              @Anchal {new Intl.DateTimeFormat('en-GB', {
                day:'2-digit',
                month:'2-digit',
                year:'numeric'
              }).format(new Date())}
            </h6>

          </div>
          <input
            type="text"
            className="searchbar"
            placeholder="Search Menu- Ctrl + M"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <nav>
        <ul>
          <li className="sidebar-title">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "sidebar-heading2 active" : "sidebar-heading2"
              }
              title="Central Sterile Service Department"
            >
              CSSD
            </NavLink>
          </li>
          <ul className="sidebar-sublist">
            {filteredMenuItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  style={{fontWeight:400,color:"#cccccc"}}
                  className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                  }
                  title={collapsed ? item.label : ""}
                >
                  <span>
                    <FontAwesomeIcon icon={faCaretRight} />
                  </span>
                  {!collapsed && item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
