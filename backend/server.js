const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Import models
const User = require('./models/User');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');

// Auth middleware
const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    // Add user from payload
    const user = await User.findById(decoded.id || decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Routes

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Register
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      company
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user profile
app.get('/api/users/profile', auth, async (req, res) => {
  try {
    // User is already in req.user from auth middleware
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user profile
app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { name, company } = req.body;
    
    // Find user and update
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (name) user.name = name;
    if (company) user.company = company;
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all customers
app.get('/api/customers', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user.id });
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a single customer
app.get('/api/customers/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new customer
app.post('/api/customers', auth, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    const newCustomer = new Customer({
      user: req.user.id,
      name,
      email,
      phone,
      address,
      notes
    });
    
    await newCustomer.save();
    
    res.json(newCustomer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a customer
app.put('/api/customers/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    // Find customer by id and user id
    let customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    // Update fields
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (notes !== undefined) customer.notes = notes;
    
    await customer.save();
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a customer
app.delete('/api/customers/:id', auth, async (req, res) => {
  try {
    // Find customer by id and user id
    const customer = await Customer.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    // Check if customer has invoices
    const invoices = await Invoice.find({ customer: req.params.id });
    
    if (invoices.length > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete customer with existing invoices. Delete the invoices first.' 
      });
    }
    
    await customer.deleteOne();
    
    res.json({ msg: 'Customer removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all invoices
app.get('/api/invoices', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a single invoice
app.get('/api/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('customer', 'name email phone address');
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // Add payments to invoice
    const payments = await Payment.find({ invoice: req.params.id });
    
    const invoiceWithPayments = {
      ...invoice.toObject(),
      payments
    };
    
    res.json(invoiceWithPayments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new invoice
app.post('/api/invoices', auth, async (req, res) => {
  try {
    const {
      customer,
      invoiceNumber,
      date,
      dueDate,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      status
    } = req.body;
    
    // Check if customer exists and belongs to user
    const customerObj = await Customer.findOne({
      _id: customer,
      user: req.user.id
    });
    
    if (!customerObj) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    const newInvoice = new Invoice({
      user: req.user.id,
      customer,
      invoiceNumber,
      date,
      dueDate,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      status: status || 'draft'
    });
    
    await newInvoice.save();
    
    // Populate customer data for response
    const populatedInvoice = await Invoice.findById(newInvoice._id)
      .populate('customer', 'name email');
    
    res.json(populatedInvoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update an invoice
app.put('/api/invoices/:id', auth, async (req, res) => {
  try {
    const {
      customer,
      invoiceNumber,
      date,
      dueDate,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      status
    } = req.body;
    
    // Find invoice by id and user id
    let invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // If customer is being updated, check if it exists and belongs to user
    if (customer && customer !== invoice.customer.toString()) {
      const customerObj = await Customer.findOne({
        _id: customer,
        user: req.user.id
      });
      
      if (!customerObj) {
        return res.status(404).json({ msg: 'Customer not found' });
      }
      
      invoice.customer = customer;
    }
    
    // Update fields
    if (invoiceNumber) invoice.invoiceNumber = invoiceNumber;
    if (date) invoice.date = date;
    if (dueDate) invoice.dueDate = dueDate;
    if (items) invoice.items = items;
    if (subtotal !== undefined) invoice.subtotal = subtotal;
    if (tax !== undefined) invoice.tax = tax;
    if (discount !== undefined) invoice.discount = discount;
    if (total !== undefined) invoice.total = total;
    if (notes !== undefined) invoice.notes = notes;
    if (status) invoice.status = status;
    
    await invoice.save();
    
    // Populate customer data for response
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name email');
    
    res.json(updatedInvoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete an invoice
app.delete('/api/invoices/:id', auth, async (req, res) => {
  try {
    // Find invoice by id and user id
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // Delete all payments for this invoice
    await Payment.deleteMany({ invoice: req.params.id });
    
    // Delete the invoice
    await invoice.deleteOne();
    
    res.json({ msg: 'Invoice removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all payments for an invoice
app.get('/api/payments/invoice/:invoiceId', auth, async (req, res) => {
  try {
    // First check if the invoice belongs to the user
    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      user: req.user.id
    });
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    const payments = await Payment.find({ invoice: req.params.invoiceId });
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new payment
app.post('/api/payments/invoice/:invoiceId', auth, async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, transactionId, notes } = req.body;
    
    // Check if invoice exists and belongs to user
    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      user: req.user.id
    });
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    const newPayment = new Payment({
      invoice: req.params.invoiceId,
      amount: parseFloat(amount),
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      transactionId,
      notes
    });
    
    await newPayment.save();
    
    // Add payment to invoice's payments array
    invoice.payments.push(newPayment._id);
    
    // Update invoice status if fully paid
    const payments = await Payment.find({ invoice: req.params.invoiceId });
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (totalPaid >= invoice.total) {
      invoice.status = 'paid';
    } else if (invoice.status !== 'sent') {
      invoice.status = 'sent';
    }
    
    await invoice.save();
    
    res.json(newPayment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a payment
app.delete('/api/payments/:id', auth, async (req, res) => {
  try {
    // Find the payment
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    
    // Check if the payment belongs to an invoice owned by the user
    const invoice = await Invoice.findOne({
      _id: payment.invoice,
      user: req.user.id
    });
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // Remove payment from invoice's payments array
    invoice.payments = invoice.payments.filter(
      p => p.toString() !== req.params.id
    );
    
    // Update invoice status
    const payments = await Payment.find({ 
      invoice: payment.invoice,
      _id: { $ne: req.params.id }
    });
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid === 0) {
      invoice.status = 'sent';
    } else if (totalPaid < invoice.total) {
      invoice.status = 'sent';
    }
    
    await invoice.save();
    
    // Delete the payment
    await payment.deleteOne();
    
    res.json({ msg: 'Payment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Generate PDF for an invoice
app.get('/api/invoices/:id/pdf', auth, async (req, res) => {
  try {
    // Check if invoice exists and belongs to user
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('customer');
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // For demo purposes, create a simple PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add company logo and info
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Add company info
    doc.fontSize(12).text(`From: ${req.user.name}`, { align: 'left' });
    if (req.user.company) {
      if (req.user.company.name) doc.text(`${req.user.company.name}`);
      if (req.user.company.address) doc.text(`${req.user.company.address}`);
      if (req.user.company.phone) doc.text(`Phone: ${req.user.company.phone}`);
      if (req.user.company.email) doc.text(`Email: ${req.user.company.email}`);
    }
    
    doc.moveDown();
    
    // Add customer info
    doc.text(`To: ${invoice.customer.name}`, { align: 'left' });
    doc.text(`Email: ${invoice.customer.email}`);
    
    if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`);
    if (invoice.customer.address) {
      const address = invoice.customer.address;
      let addressText = '';
      if (address.street) addressText += address.street;
      if (address.city) addressText += (addressText ? ', ' : '') + address.city;
      if (address.state) addressText += (addressText ? ', ' : '') + address.state;
      if (address.zipCode) addressText += (addressText ? ' ' : '') + address.zipCode;
      if (address.country) addressText += (addressText ? ', ' : '') + address.country;
      
      if (addressText) doc.text(`Address: ${addressText}`);
    }
    
    doc.moveDown();
    
    // Add invoice details
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    
    doc.moveDown();
    
    // Add items table
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 300;
    const rateX = 350;
    const amountX = 450;
    
    doc.font('Helvetica-Bold');
    doc.text('Item', itemX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Rate', rateX, tableTop);
    doc.text('Amount', amountX, tableTop);
    doc.moveDown();
    
    // Add horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.font('Helvetica');
    
    // Add items
    invoice.items.forEach(item => {
      const y = doc.y;
      doc.text(item.description, itemX, y);
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(`$${item.rate.toFixed(2)}`, rateX, y);
      doc.text(`$${item.amount.toFixed(2)}`, amountX, y);
      doc.moveDown();
    });
    
    // Add horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.moveDown();
    
    // Add totals
    const totalsX = 350;
    doc.text('Subtotal:', totalsX);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, amountX, doc.y - 12);
    
    if (invoice.tax) {
      doc.text('Tax:', totalsX);
      doc.text(`$${(invoice.subtotal * invoice.tax / 100).toFixed(2)}`, amountX, doc.y - 12);
    }
    
    if (invoice.discount) {
      doc.text('Discount:', totalsX);
      doc.text(`$${(invoice.subtotal * invoice.discount / 100).toFixed(2)}`, amountX, doc.y - 12);
    }
    
    doc.font('Helvetica-Bold');
    doc.text('Total:', totalsX);
    doc.text(`$${invoice.total.toFixed(2)}`, amountX, doc.y - 12);
    
    doc.font('Helvetica');
    doc.moveDown();
    
    // Add notes if any
    if (invoice.notes) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Notes:');
      doc.font('Helvetica').text(invoice.notes);
    }
    
    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('Invoice Generator API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to MongoDB Atlas');
});