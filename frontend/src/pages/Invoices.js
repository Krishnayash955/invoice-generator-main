import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, InputGroup, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaFileDownload } from 'react-icons/fa';
import { getInvoices, deleteInvoice, getInvoicePdf } from '../utils/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteInvoice(invoiceToDelete._id);
      setInvoices(invoices.filter(i => i._id !== invoiceToDelete._id));
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (err) {
      setError('Failed to delete invoice');
      console.error(err);
    }
  };

  const handleDownloadPdf = async (id) => {
    try {
      const pdfBlob = await getInvoicePdf(id);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    let variant;
    switch (status) {
      case 'paid':
        variant = 'success';
        break;
      case 'sent':
        variant = 'info';
        break;
      case 'overdue':
        variant = 'danger';
        break;
      default:
        variant = 'secondary';
    }
    
    return (
      <Badge bg={variant} className="text-uppercase">
        {status}
      </Badge>
    );
  };

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

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Invoices</h2>
        <Link to="/invoices/new">
          <Button variant="primary">
            <FaPlus className="me-2" /> Create Invoice
          </Button>
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {filteredInvoices.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.customer.name}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td>${invoice.total.toFixed(2)}</td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>
                      <Link to={`/invoices/view/${invoice._id}`} className="me-2">
                        <Button variant="outline-primary" size="sm" title="View">
                          <FaEye />
                        </Button>
                      </Link>
                      <Link to={`/invoices/edit/${invoice._id}`} className="me-2">
                        <Button variant="outline-secondary" size="sm" title="Edit">
                          <FaEdit />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        className="me-2"
                        onClick={() => handleDownloadPdf(invoice._id)}
                        title="Download PDF"
                      >
                        <FaFileDownload />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteClick(invoice)}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-3">
              <p>No invoices found</p>
              <Link to="/invoices/new">
                <Button variant="primary">Create Invoice</Button>
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Invoices;