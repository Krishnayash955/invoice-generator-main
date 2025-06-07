import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFileInvoiceDollar, FaUsers, FaMoneyBillWave, FaExclamationTriangle } from 'react-icons/fa';
import { getInvoices } from '../utils/api';

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await getInvoices();
        setInvoices(data);
      } catch (err) {
        setError('Failed to load invoices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Calculate statistics
  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(invoice => invoice.status === 'paid').length;
  const totalOverdue = invoices.filter(invoice => invoice.status === 'overdue').length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  
  // Get recent invoices (last 5)
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaFileInvoiceDollar size={30} className="mb-2 text-primary" />
              <Card.Title>{totalInvoices}</Card.Title>
              <Card.Text>Total Invoices</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaMoneyBillWave size={30} className="mb-2 text-success" />
              <Card.Title>{totalPaid}</Card.Title>
              <Card.Text>Paid Invoices</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaExclamationTriangle size={30} className="mb-2 text-danger" />
              <Card.Title>{totalOverdue}</Card.Title>
              <Card.Text>Overdue Invoices</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers size={30} className="mb-2 text-info" />
              <Card.Title>${totalAmount.toFixed(2)}</Card.Title>
              <Card.Text>Total Amount</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Invoices */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Invoices</h5>
          <Link to="/invoices">
            <Button variant="outline-primary" size="sm">View All</Button>
          </Link>
        </Card.Header>
        <Card.Body>
          {recentInvoices.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.customer.name}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>${invoice.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/invoices/view/${invoice._id}`}>
                        <Button variant="outline-primary" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-3">
              <p>No invoices yet</p>
              <Link to="/invoices/new">
                <Button variant="primary">Create Invoice</Button>
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="text-center mb-3 mb-md-0">
              <Link to="/invoices/new">
                <Button variant="primary" className="w-100">
                  <FaFileInvoiceDollar className="me-2" />
                  Create Invoice
                </Button>
              </Link>
            </Col>
            <Col md={4} className="text-center mb-3 mb-md-0">
              <Link to="/customers/new">
                <Button variant="success" className="w-100">
                  <FaUsers className="me-2" />
                  Add Customer
                </Button>
              </Link>
            </Col>
            <Col md={4} className="text-center">
              <Link to="/invoices">
                <Button variant="info" className="w-100 text-white">
                  <FaMoneyBillWave className="me-2" />
                  Manage Invoices
                </Button>
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;