import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaUsers, FaFileInvoiceDollar, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={2} className="sidebar">
          <div className="p-3 text-center">
            <h4>Invoice Generator</h4>
            <p className="small mb-0">{user?.name}</p>
            <p className="small text-muted">{user?.email}</p>
          </div>
          <hr className="my-2" />
          <Nav className="flex-column">
            <NavLink to="/" className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }>
              <FaHome className="me-2" /> Dashboard
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }>
              <FaUsers className="me-2" /> Customers
            </NavLink>
            <NavLink to="/invoices" className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }>
              <FaFileInvoiceDollar className="me-2" /> Invoices
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }>
              <FaUserCircle className="me-2" /> Profile
            </NavLink>
          </Nav>
          <div className="mt-auto p-3">
            <Button 
              variant="outline-light" 
              size="sm" 
              className="w-100"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" /> Logout
            </Button>
          </div>
        </Col>
        
        {/* Main Content */}
        <Col md={10} className="main-content">
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
};

export default Layout;