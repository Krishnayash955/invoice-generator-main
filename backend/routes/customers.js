const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

// @route   GET api/customers
// @desc    Get all customers for a user
// @access  Private
router.get('/', auth, customerController.getCustomers);

// @route   GET api/customers/:id
// @desc    Get a single customer
// @access  Private
router.get('/:id', auth, customerController.getCustomer);

// @route   POST api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', auth, customerController.createCustomer);

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', auth, customerController.updateCustomer);

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', auth, customerController.deleteCustomer);

module.exports = router;