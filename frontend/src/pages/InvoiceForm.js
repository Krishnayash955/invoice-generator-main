import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Table } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { getInvoice, createInvoice, updateInvoice, getCustomers } from '../utils/api';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: '',
    status: 'draft'
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersData = await getCustomers();
        setCustomers(customersData);
        
        // If editing, fetch invoice data
        if (isEditMode) {
          const invoiceData = await getInvoice(id);
          
          // Format dates for form inputs
          const formattedDate = new Date(invoiceData.date).toISOString().split('T')[0];
          const formattedDueDate = new Date(invoiceData.dueDate).toISOString().split('T')[0];
          
          setFormData({
            customer: invoiceData.customer._id,
            invoiceNumber: invoiceData.invoiceNumber,
            date: formattedDate,
            dueDate: formattedDueDate,
            items: invoiceData.items,
            subtotal: invoiceData.subtotal,
            tax: invoiceData.tax,
            discount: invoiceData.discount,
            total: invoiceData.total,
            notes: invoiceData.notes || '',
            status: invoiceData.status
          });
        } else if (customersData.length > 0) {
          // Set first customer as default for new invoices
          setFormData(prev => ({
            ...prev,
            customer: customersData[0]._id
          }));
          
          // Generate a new invoice number (simple implementation)
          const timestamp = Date.now().toString().slice(-6);
          setFormData(prev => ({
            ...prev,
            invoiceNumber: `INV-${timestamp}`
          }));
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);

  // Calculate item amount when quantity or rate changes
  const calculateItemAmount = (item) => {
    return parseFloat(item.quantity) * parseFloat(item.rate);
  };

  // Recalculate totals when items, tax, or discount changes
  const recalculateTotals = (items, tax, discount) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal,
      total
    };
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // Recalculate amount for the item
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = calculateItemAmount(updatedItems[index]);
    }
    
    // Recalculate totals
    const { subtotal, total } = recalculateTotals(
      updatedItems, 
      formData.tax, 
      formData.discount
    );
    
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const handleAddItem = () => {
    const newItem = { description: '', quantity: 1, rate: 0, amount: 0 };
    const updatedItems = [...formData.items, newItem];
    
    // Recalculate totals
    const { subtotal, total } = recalculateTotals(
      updatedItems, 
      formData.tax, 
      formData.discount
    );
    
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      return; // Don't remove the last item
    }
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    // Recalculate totals
    const { subtotal, total } = recalculateTotals(
      updatedItems, 
      formData.tax, 
      formData.discount
    );
    
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total
    });
  };

  const handleTaxDiscountChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    
    // Recalculate totals
    const { subtotal, total } = recalculateTotals(
      formData.items, 
      field === 'tax' ? numValue : formData.tax, 
      field === 'discount' ? numValue : formData.discount
    );
    
    setFormData({
      ...formData,
      [field]: numValue,
      subtotal,
      total
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tax') {
      handleTaxDiscountChange('tax', value);
    } else if (name === 'discount') {
      handleTaxDiscountChange('discount', value);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode) {
        await updateInvoice(id, formData);
      } else {
        await createInvoice(formData);
      }
      
      navigate('/invoices');
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} invoice`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
        <h2>{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h2>
        <Link to="/invoices">
          <Button variant="outline-secondary">Back to Invoices</Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="customer">
                  <Form.Label>Customer *</Form.Label>
                  <Form.Select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="invoiceNumber">
                  <Form.Label>Invoice Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="date">
                  <Form.Label>Invoice Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="dueDate">
                  <Form.Label>Due Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="status">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </Form.Select>
            </Form.Group>

            <h5 className="mt-4 mb-3">Items</h5>
            
            <Table responsive>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                        required
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                        required
                      />
                    </td>
                    <td>
                      ${item.amount ? item.amount.toFixed(2) : '0.00'}
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            <Button
              variant="outline-primary"
              className="mb-4"
              onClick={handleAddItem}
            >
              <FaPlus className="me-2" /> Add Item
            </Button>

            <Row className="mt-4">
              <Col md={6}>
                <Form.Group className="mb-3" controlId="notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes or payment instructions"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Card className="bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>${formData.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Tax (%):</span>
                      <div style={{ width: '100px' }}>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.1"
                          name="tax"
                          value={formData.tax}
                          onChange={handleChange}
                          size="sm"
                        />
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Discount (%):</span>
                      <div style={{ width: '100px' }}>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.1"
                          name="discount"
                          value={formData.discount}
                          onChange={handleChange}
                          size="sm"
                        />
                      </div>
                    </div>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between">
                      <h5>Total:</h5>
                      <h5>${formData.total.toFixed(2)}</h5>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-4">
              <Link to="/invoices" className="me-2">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Invoice'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InvoiceForm;