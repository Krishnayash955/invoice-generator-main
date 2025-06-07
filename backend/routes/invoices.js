const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');

// @route   GET api/invoices
// @desc    Get all invoices for a user
// @access  Private
router.get('/', auth, invoiceController.getInvoices);

// @route   GET api/invoices/:id
// @desc    Get a single invoice
// @access  Private
router.get('/:id', auth, invoiceController.getInvoice);

// @route   POST api/invoices
// @desc    Create a new invoice
// @access  Private
router.post('/', auth, invoiceController.createInvoice);

// @route   PUT api/invoices/:id
// @desc    Update an invoice
// @access  Private
router.put('/:id', auth, invoiceController.updateInvoice);

// @route   DELETE api/invoices/:id
// @desc    Delete an invoice
// @access  Private
router.delete('/:id', auth, invoiceController.deleteInvoice);

// @route   GET api/invoices/:id/pdf
// @desc    Generate PDF for an invoice
// @access  Private
router.get('/:id/pdf', auth, invoiceController.generatePDF);

module.exports = router;