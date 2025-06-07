import React, { useState } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: {
          name: formData.companyName,
          address: formData.companyAddress,
          phone: formData.companyPhone,
          email: formData.companyEmail,
          website: formData.companyWebsite
        }
      };
      
      const success = await register(userData);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <div className="auth-form" style={{ maxWidth: '600px' }}>
        <h2 className="text-center mb-4">Register</h2>
        
        {(error || validationError) && (
          <Alert variant="danger">
            {validationError || error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <h5 className="mb-3">Personal Information</h5>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <h5 className="mb-3 mt-4">Company Information (Optional)</h5>
          <Form.Group className="mb-3" controlId="companyName">
            <Form.Label>Company Name</Form.Label>
            <Form.Control
              type="text"
              name="companyName"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="companyAddress">
            <Form.Label>Company Address</Form.Label>
            <Form.Control
              type="text"
              name="companyAddress"
              placeholder="Enter company address"
              value={formData.companyAddress}
              onChange={handleChange}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="companyPhone">
                <Form.Label>Company Phone</Form.Label>
                <Form.Control
                  type="text"
                  name="companyPhone"
                  placeholder="Enter company phone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="companyEmail">
                <Form.Label>Company Email</Form.Label>
                <Form.Control
                  type="email"
                  name="companyEmail"
                  placeholder="Enter company email"
                  value={formData.companyEmail}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="companyWebsite">
            <Form.Label>Company Website</Form.Label>
            <Form.Control
              type="text"
              name="companyWebsite"
              placeholder="Enter company website"
              value={formData.companyWebsite}
              onChange={handleChange}
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mt-3"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
          
          <div className="text-center mt-3">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
};

export default Register;