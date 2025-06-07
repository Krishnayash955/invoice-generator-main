// Simple in-memory database for demonstration purposes
const { v4: uuidv4 } = require('uuid');

class InMemoryDb {
  constructor() {
    this.users = [];
    this.customers = [];
    this.invoices = [];
    this.payments = [];
    
    // Add a demo user
    this.users.push({
      _id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      password: '$2a$10$XFE/UQSLEDzDLFEYDmD5a.0ZVKAh6JRbBQ7rNlFbL5DP.XZXuZ5Vy', // password: 'password123'
      company: {
        name: 'Demo Company',
        address: '123 Demo Street, Demo City',
        phone: '123-456-7890',
        email: 'info@democompany.com',
        website: 'www.democompany.com'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add some demo customers
    this.customers.push({
      _id: '1',
      user: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      address: {
        street: '456 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      notes: 'Regular customer',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.customers.push({
      _id: '2',
      user: '1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-987-6543',
      address: {
        street: '789 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA'
      },
      notes: 'Premium customer',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add a demo invoice
    this.invoices.push({
      _id: '1',
      user: '1',
      customer: '1',
      invoiceNumber: 'INV-001',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: 'Web Development',
          quantity: 10,
          rate: 100,
          amount: 1000
        },
        {
          description: 'Hosting (1 year)',
          quantity: 1,
          rate: 200,
          amount: 200
        }
      ],
      subtotal: 1200,
      tax: 10,
      discount: 5,
      total: 1260,
      notes: 'Thank you for your business!',
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add a demo payment
    this.payments.push({
      _id: '1',
      invoice: '1',
      amount: 500,
      paymentDate: new Date(),
      paymentMethod: 'card',
      transactionId: 'txn_123456',
      notes: 'Partial payment',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  // User methods
  async findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }
  
  async findUserById(id) {
    return this.users.find(user => user._id === id);
  }
  
  async createUser(userData) {
    const newUser = {
      _id: uuidv4(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  async updateUser(id, userData) {
    const index = this.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }
  
  // Customer methods
  async getCustomers(userId) {
    return this.customers.filter(customer => customer.user === userId);
  }
  
  async getCustomer(id, userId) {
    return this.customers.find(customer => customer._id === id && customer.user === userId);
  }
  
  async createCustomer(customerData, userId) {
    const newCustomer = {
      _id: uuidv4(),
      user: userId,
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id, customerData, userId) {
    const index = this.customers.findIndex(customer => customer._id === id && customer.user === userId);
    if (index === -1) return null;
    
    this.customers[index] = {
      ...this.customers[index],
      ...customerData,
      updatedAt: new Date()
    };
    
    return this.customers[index];
  }
  
  async deleteCustomer(id, userId) {
    const index = this.customers.findIndex(customer => customer._id === id && customer.user === userId);
    if (index === -1) return false;
    
    this.customers.splice(index, 1);
    return true;
  }
  
  // Invoice methods
  async getInvoices(userId) {
    const invoices = this.invoices.filter(invoice => invoice.user === userId);
    
    // Populate customer data
    return invoices.map(invoice => {
      const customer = this.customers.find(c => c._id === invoice.customer);
      return {
        ...invoice,
        customer: customer || { name: 'Unknown Customer' }
      };
    });
  }
  
  async getInvoice(id, userId) {
    const invoice = this.invoices.find(invoice => invoice._id === id && invoice.user === userId);
    if (!invoice) return null;
    
    // Populate customer data
    const customer = this.customers.find(c => c._id === invoice.customer);
    return {
      ...invoice,
      customer: customer || { name: 'Unknown Customer' }
    };
  }
  
  async createInvoice(invoiceData, userId) {
    const newInvoice = {
      _id: uuidv4(),
      user: userId,
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invoices.push(newInvoice);
    
    // Populate customer data for return
    const customer = this.customers.find(c => c._id === newInvoice.customer);
    return {
      ...newInvoice,
      customer: customer || { name: 'Unknown Customer' }
    };
  }
  
  async updateInvoice(id, invoiceData, userId) {
    const index = this.invoices.findIndex(invoice => invoice._id === id && invoice.user === userId);
    if (index === -1) return null;
    
    this.invoices[index] = {
      ...this.invoices[index],
      ...invoiceData,
      updatedAt: new Date()
    };
    
    // Populate customer data for return
    const customer = this.customers.find(c => c._id === this.invoices[index].customer);
    return {
      ...this.invoices[index],
      customer: customer || { name: 'Unknown Customer' }
    };
  }
  
  async deleteInvoice(id, userId) {
    const index = this.invoices.findIndex(invoice => invoice._id === id && invoice.user === userId);
    if (index === -1) return false;
    
    this.invoices.splice(index, 1);
    
    // Also delete related payments
    this.payments = this.payments.filter(payment => payment.invoice !== id);
    
    return true;
  }
  
  // Payment methods
  async getPayments(invoiceId) {
    return this.payments.filter(payment => payment.invoice === invoiceId);
  }
  
  async createPayment(paymentData, invoiceId) {
    const newPayment = {
      _id: uuidv4(),
      invoice: invoiceId,
      ...paymentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payments.push(newPayment);
    
    // Update invoice status if fully paid
    const invoice = this.invoices.find(inv => inv._id === invoiceId);
    if (invoice) {
      const totalPaid = this.payments
        .filter(payment => payment.invoice === invoiceId)
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      if (totalPaid >= invoice.total) {
        invoice.status = 'paid';
      } else if (invoice.status !== 'sent') {
        invoice.status = 'sent';
      }
    }
    
    return newPayment;
  }
  
  async deletePayment(id) {
    const index = this.payments.findIndex(payment => payment._id === id);
    if (index === -1) return false;
    
    const invoiceId = this.payments[index].invoice;
    this.payments.splice(index, 1);
    
    // Update invoice status
    const invoice = this.invoices.find(inv => inv._id === invoiceId);
    if (invoice) {
      const totalPaid = this.payments
        .filter(payment => payment.invoice === invoiceId)
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      if (totalPaid === 0) {
        invoice.status = 'sent';
      } else if (totalPaid < invoice.total) {
        invoice.status = 'sent';
      }
    }
    
    return true;
  }
}

module.exports = new InMemoryDb();