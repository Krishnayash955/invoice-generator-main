import axios from 'axios';

// Customer API calls
export const getCustomers = async () => {
  try {
    const res = await axios.get('/api/customers');
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error fetching customers';
  }
};

export const getCustomer = async (id) => {
  try {
    const res = await axios.get(`/api/customers/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error fetching customer';
  }
};

export const createCustomer = async (customerData) => {
  try {
    const res = await axios.post('/api/customers', customerData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error creating customer';
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const res = await axios.put(`/api/customers/${id}`, customerData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error updating customer';
  }
};

export const deleteCustomer = async (id) => {
  try {
    await axios.delete(`/api/customers/${id}`);
    return true;
  } catch (err) {
    throw err.response?.data?.msg || 'Error deleting customer';
  }
};

// Invoice API calls
export const getInvoices = async () => {
  try {
    const res = await axios.get('/api/invoices');
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error fetching invoices';
  }
};

export const getInvoice = async (id) => {
  try {
    const res = await axios.get(`/api/invoices/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error fetching invoice';
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    const res = await axios.post('/api/invoices', invoiceData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error creating invoice';
  }
};

export const updateInvoice = async (id, invoiceData) => {
  try {
    const res = await axios.put(`/api/invoices/${id}`, invoiceData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error updating invoice';
  }
};

export const deleteInvoice = async (id) => {
  try {
    await axios.delete(`/api/invoices/${id}`);
    return true;
  } catch (err) {
    throw err.response?.data?.msg || 'Error deleting invoice';
  }
};

export const getInvoicePdf = async (id) => {
  try {
    const res = await axios.get(`/api/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error generating PDF';
  }
};

// Payment API calls
export const getPayments = async (invoiceId) => {
  try {
    const res = await axios.get(`/api/payments/invoice/${invoiceId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error fetching payments';
  }
};

export const createPayment = async (invoiceId, paymentData) => {
  try {
    const res = await axios.post(`/api/payments/invoice/${invoiceId}`, paymentData);
    return res.data;
  } catch (err) {
    throw err.response?.data?.msg || 'Error creating payment';
  }
};

export const deletePayment = async (id) => {
  try {
    await axios.delete(`/api/payments/${id}`);
    return true;
  } catch (err) {
    throw err.response?.data?.msg || 'Error deleting payment';
  }
};