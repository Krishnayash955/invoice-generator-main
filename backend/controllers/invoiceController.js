const PDFDocument = require('pdfkit');
const db = require('../utils/inMemoryDb');

// Get all invoices for a user
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await db.getInvoices(req.user.id);
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get a single invoice
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await db.getInvoice(req.params.id, req.user.id);
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // Get payments for this invoice
    const payments = await db.getPayments(req.params.id);
    
    // Add payments to invoice
    const invoiceWithPayments = {
      ...invoice,
      payments
    };
    
    res.json(invoiceWithPayments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create a new invoice
exports.createInvoice = async (req, res) => {
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
    const customerDoc = await db.getCustomer(customer, req.user.id);
    if (!customerDoc) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    const invoice = await db.createInvoice({
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
    }, req.user.id);
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update an invoice
exports.updateInvoice = async (req, res) => {
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
    
    // Build invoice object
    const invoiceData = {};
    if (customer) {
      // Check if customer exists and belongs to user
      const customerDoc = await db.getCustomer(customer, req.user.id);
      if (!customerDoc) {
        return res.status(404).json({ msg: 'Customer not found' });
      }
      
      invoiceData.customer = customer;
    }
    if (invoiceNumber) invoiceData.invoiceNumber = invoiceNumber;
    if (date) invoiceData.date = date;
    if (dueDate) invoiceData.dueDate = dueDate;
    if (items) invoiceData.items = items;
    if (subtotal !== undefined) invoiceData.subtotal = subtotal;
    if (tax !== undefined) invoiceData.tax = tax;
    if (discount !== undefined) invoiceData.discount = discount;
    if (total !== undefined) invoiceData.total = total;
    if (notes !== undefined) invoiceData.notes = notes;
    if (status) invoiceData.status = status;
    
    const invoice = await db.updateInvoice(req.params.id, invoiceData, req.user.id);
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete an invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const success = await db.deleteInvoice(req.params.id, req.user.id);
    
    // Check if invoice exists
    if (!success) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    res.json({ msg: 'Invoice removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Generate PDF for an invoice
exports.generatePDF = async (req, res) => {
  try {
    const invoice = await db.getInvoice(req.params.id, req.user.id);
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    // Get user data
    const user = await db.findUserById(req.user.id);
    
    // Create a PDF document
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
    doc.fontSize(12).text(`From: ${user.name}`, { align: 'left' });
    if (user.company) {
      if (user.company.name) doc.text(`${user.company.name}`);
      if (user.company.address) doc.text(`${user.company.address}`);
      if (user.company.phone) doc.text(`Phone: ${user.company.phone}`);
      if (user.company.email) doc.text(`Email: ${user.company.email}`);
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
};