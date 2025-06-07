const db = require('../utils/inMemoryDb');

// Get all customers for a user
exports.getCustomers = async (req, res) => {
  try {
    const customers = await db.getCustomers(req.user.id);
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get a single customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await db.getCustomer(req.params.id, req.user.id);
    
    // Check if customer exists
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    const customer = await db.createCustomer({
      name,
      email,
      phone,
      address,
      notes
    }, req.user.id);
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    const customerData = {};
    if (name) customerData.name = name;
    if (email) customerData.email = email;
    if (phone) customerData.phone = phone;
    if (address) customerData.address = address;
    if (notes) customerData.notes = notes;
    
    const customer = await db.updateCustomer(req.params.id, customerData, req.user.id);
    
    // Check if customer exists
    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const success = await db.deleteCustomer(req.params.id, req.user.id);
    
    // Check if customer exists
    if (!success) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    
    res.json({ msg: 'Customer removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};