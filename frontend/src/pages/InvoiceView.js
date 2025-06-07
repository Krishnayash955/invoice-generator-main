import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaFileDownload, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { getInvoice, getInvoicePdf, updateInvoice, getPayments, createPayment, deletePayment } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef();
  
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    transactionId: '',
    notes: ''
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invoiceData = await getInvoice(id);
      setInvoice(invoiceData);
      
      const paymentsData = await getPayments(id);
      setPayments(paymentsData);
      
      setError(null);
    } catch (err) {
      setError('Failed to load invoice data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const handleDownloadPdf = async () => {
    try {
      const pdfBlob = await getInvoicePdf(id);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateInvoice(id, { status: newStatus });
      setInvoice({ ...invoice, status: newStatus });
    } catch (err) {
      setError('Failed to update invoice status');
      console.error(err);
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPaymentError(null);
    
    try {
      const newPayment = await createPayment(id, paymentData);
      setPayments([...payments, newPayment]);
      
      // Refresh invoice to get updated status
      const updatedInvoice = await getInvoice(id);
      setInvoice(updatedInvoice);
      
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'card',
        transactionId: '',
        notes: ''
      });
    } catch (err) {
      setPaymentError('Failed to record payment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaymentClick = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const handleDeletePaymentConfirm = async () => {
    try {
      await deletePayment(paymentToDelete._id);
      setPayments(payments.filter(p => p._id !== paymentToDelete._id));
      
      // Refresh invoice to get updated status
      const updatedInvoice = await getInvoice(id);
      setInvoice(updatedInvoice);
      
      setShowDeleteModal(false);
      setPaymentToDelete(null);
    } catch (err) {
      setError('Failed to delete payment');
      console.error(err);
    }
  };

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

  const getPaymentMethodBadge = (method) => {
    let className;
    switch (method) {
      case 'upi':
        className = 'payment-upi';
        break;
      case 'bank_transfer':
        className = 'payment-bank_transfer';
        break;
      case 'cash':
        className = 'payment-cash';
        break;
      case 'card':
        className = 'payment-card';
        break;
      default:
        className = '';
    }
    
    return (
      <span className={`payment-method-badge ${className}`}>
        {method.replace('_', ' ')}
      </span>
    );
  };

  // Calculate total paid amount
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = invoice ? invoice.total - totalPaid : 0;

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
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Link to="/invoices">
            <Button variant="primary">Back to Invoices</Button>
          </Link>
        </div>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Invoice not found</Alert>
        <div className="text-center mt-3">
          <Link to="/invoices">
            <Button variant="primary">Back to Invoices</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          Invoice {invoice.invoiceNumber} {getStatusBadge(invoice.status)}
        </h2>
        <div>
          <Link to={`/invoices/edit/${id}`} className="me-2">
            <Button variant="outline-primary">
              <FaEdit className="me-2" /> Edit
            </Button>
          </Link>
          <Button variant="outline-secondary" onClick={handlePrint} className="me-2">
            Print
          </Button>
          <Button variant="outline-info" onClick={handleDownloadPdf}>
            <FaFileDownload className="me-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Row>
        <Col md={8}>
          {/* Invoice Preview */}
          <Card className="mb-4 invoice-preview" ref={printRef}>
            <Card.Body>
              <Row className="mb-4">
                <Col>
                  <h4 className="text-uppercase text-center mb-4">Invoice</h4>
                  
                  {/* From (Company) */}
                  <div className="mb-4">
                    <h5>From:</h5>
                    <div>{user?.name}</div>
                    {user?.company?.name && <div>{user.company.name}</div>}
                    {user?.company?.address && <div>{user.company.address}</div>}
                    {user?.company?.phone && <div>Phone: {user.company.phone}</div>}
                    {user?.company?.email && <div>Email: {user.company.email}</div>}
                    {user?.company?.website && <div>Website: {user.company.website}</div>}
                  </div>
                  
                  {/* To (Customer) */}
                  <div className="mb-4">
                    <h5>To:</h5>
                    <div>{invoice.customer.name}</div>
                    <div>Email: {invoice.customer.email}</div>
                    {invoice.customer.phone && <div>Phone: {invoice.customer.phone}</div>}
                    {invoice.customer.address && (
                      <div>
                        {invoice.customer.address.street && `${invoice.customer.address.street}, `}
                        {invoice.customer.address.city && `${invoice.customer.address.city}, `}
                        {invoice.customer.address.state && `${invoice.customer.address.state}, `}
                        {invoice.customer.address.zipCode && `${invoice.customer.address.zipCode}, `}
                        {invoice.customer.address.country && invoice.customer.address.country}
                      </div>
                    )}
                  </div>
                  
                  {/* Invoice Details */}
                  <div className="mb-4">
                    <Row>
                      <Col md={6}>
                        <div><strong>Invoice Number:</strong> {invoice.invoiceNumber}</div>
                        <div><strong>Status:</strong> {invoice.status.toUpperCase()}</div>
                      </Col>
                      <Col md={6}>
                        <div><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</div>
                        <div><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</div>
                      </Col>
                    </Row>
                  </div>
                  
                  {/* Items Table */}
                  <Table bordered>
                    <thead className="bg-light">
                      <tr>
                        <th>Description</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">${item.rate.toFixed(2)}</td>
                          <td className="text-end">${item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {/* Totals */}
                  <div className="d-flex justify-content-end">
                    <div style={{ width: '250px' }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>${invoice.subtotal.toFixed(2)}</span>
                      </div>
                      
                      {invoice.tax > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tax ({invoice.tax}%):</span>
                          <span>${((invoice.subtotal * invoice.tax) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {invoice.discount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Discount ({invoice.discount}%):</span>
                          <span>-${((invoice.subtotal * invoice.discount) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <hr />
                      
                      <div className="d-flex justify-content-between">
                        <h5>Total:</h5>
                        <h5>${invoice.total.toFixed(2)}</h5>
                      </div>
                      
                      {payments.length > 0 && (
                        <>
                          <div className="d-flex justify-content-between text-success">
                            <span>Paid:</span>
                            <span>${totalPaid.toFixed(2)}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between">
                            <strong>Balance Due:</strong>
                            <strong>${remainingAmount.toFixed(2)}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {invoice.notes && (
                    <div className="mt-4">
                      <h5>Notes:</h5>
                      <p>{invoice.notes}</p>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          {/* Actions Panel */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Change Status</h6>
                <div className="d-grid gap-2">
                  <Button 
                    variant={invoice.status === 'draft' ? 'secondary' : 'outline-secondary'}
                    onClick={() => handleStatusChange('draft')}
                    disabled={invoice.status === 'draft'}
                  >
                    Mark as Draft
                  </Button>
                  <Button 
                    variant={invoice.status === 'sent' ? 'info' : 'outline-info'}
                    onClick={() => handleStatusChange('sent')}
                    disabled={invoice.status === 'sent'}
                  >
                    Mark as Sent
                  </Button>
                  <Button 
                    variant={invoice.status === 'paid' ? 'success' : 'outline-success'}
                    onClick={() => handleStatusChange('paid')}
                    disabled={invoice.status === 'paid'}
                  >
                    Mark as Paid
                  </Button>
                  <Button 
                    variant={invoice.status === 'overdue' ? 'danger' : 'outline-danger'}
                    onClick={() => handleStatusChange('overdue')}
                    disabled={invoice.status === 'overdue'}
                  >
                    Mark as Overdue
                  </Button>
                </div>
              </div>
              
              <hr />
              
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Record Payment</h6>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setShowPaymentModal(true)}
                    disabled={invoice.status === 'paid' || remainingAmount <= 0}
                  >
                    <FaMoneyBillWave className="me-2" /> Add Payment
                  </Button>
                </div>
                
                {payments.length > 0 ? (
                  <div>
                    <div className="mb-2">
                      <strong>Payment History</strong>
                    </div>
                    {payments.map(payment => (
                      <Card key={payment._id} className="mb-2">
                        <Card.Body className="p-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div>${payment.amount.toFixed(2)}</div>
                              <div className="small text-muted">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </div>
                              <div>{getPaymentMethodBadge(payment.paymentMethod)}</div>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeletePaymentClick(payment)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                          {payment.notes && (
                            <div className="small mt-2">
                              <strong>Note:</strong> {payment.notes}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted">No payments recorded</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* Payment Summary */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Payment Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Amount:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Amount Paid:</span>
                <span>${totalPaid.toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Balance Due:</strong>
                <strong>${remainingAmount.toFixed(2)}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Record Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {paymentError && <Alert variant="danger">{paymentError}</Alert>}
          
          <Form onSubmit={handlePaymentSubmit}>
            <Form.Group className="mb-3" controlId="amount">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                value={paymentData.amount}
                onChange={handlePaymentChange}
                min="0.01"
                step="0.01"
                max={remainingAmount}
                placeholder={`Maximum: $${remainingAmount.toFixed(2)}`}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="paymentDate">
              <Form.Label>Payment Date *</Form.Label>
              <Form.Control
                type="date"
                name="paymentDate"
                value={paymentData.paymentDate}
                onChange={handlePaymentChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="paymentMethod">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handlePaymentChange}
                required
              >
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="transactionId">
              <Form.Label>Transaction ID</Form.Label>
              <Form.Control
                type="text"
                name="transactionId"
                value={paymentData.transactionId}
                onChange={handlePaymentChange}
                placeholder="Optional"
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="notes">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={paymentData.notes}
                onChange={handlePaymentChange}
                placeholder="Optional"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowPaymentModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting || !paymentData.amount}
              >
                {submitting ? 'Saving...' : 'Save Payment'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Payment Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this payment of <strong>${paymentToDelete?.amount.toFixed(2)}</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeletePaymentConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InvoiceView;