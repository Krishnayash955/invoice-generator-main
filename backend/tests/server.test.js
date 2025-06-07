const request = require('supertest');
const express = require('express');

// Create a simple express app for testing
const app = express();
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

describe('Server', () => {
  it('should return 200 for the root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('API is running');
  });
});