const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// @route   GET api/payments/invoice/:invoiceId
// @desc    Get all payments for an invoice
// @access  Private
router.get('/invoice/:invoiceId', auth, paymentController.getPayments);

// @route   POST api/payments/invoice/:invoiceId
// @desc    Create a new payment for an invoice
// @access  Private
router.post('/invoice/:invoiceId', auth, paymentController.createPayment);

// @route   DELETE api/payments/:id
// @desc    Delete a payment
// @access  Private
router.delete('/:id', auth, paymentController.deletePayment);

module.exports = router;