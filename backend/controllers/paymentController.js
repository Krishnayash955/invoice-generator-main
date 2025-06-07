const db = require('../utils/inMemoryDb');

// Get all payments for an invoice
exports.getPayments = async (req, res) => {
  try {
    const invoice = await db.getInvoice(req.params.invoiceId, req.user.id);
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    const payments = await db.getPayments(req.params.invoiceId);
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, transactionId, notes } = req.body;
    
    const invoice = await db.getInvoice(req.params.invoiceId, req.user.id);
    
    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    
    const payment = await db.createPayment({
      amount: parseFloat(amount),
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      transactionId,
      notes
    }, req.params.invoiceId);
    
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
  try {
    const success = await db.deletePayment(req.params.id);
    
    // Check if payment exists
    if (!success) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    
    res.json({ msg: 'Payment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};