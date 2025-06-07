# Invoice Generator

A full-stack web application for creating and managing invoices, built with React, Express, and MongoDB. Includes CI/CD pipeline with GitHub Actions and Docker.

## Features

- User authentication (login/register)
- Customer management (create, edit, delete)
- Invoice management (create, edit, delete)
- Invoice status tracking (Paid/Overdue/Sent/Draft)
- Payment processing (UPI, bank transfer, cash, card)
- PDF generation and download

## Tech Stack

### Frontend
- React
- React Router
- React Bootstrap
- Axios
- Formik & Yup (form validation)
- React-to-print (for printing invoices)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- PDFKit (for PDF generation)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/invoice-generator.git
cd invoice-generator
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Running the Application

1. Start the backend server
```
cd backend
npm run dev
```

2. Start the frontend development server
```
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
invoice-generator/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── .env             # Environment variables
│   ├── package.json     # Backend dependencies
│   └── server.js        # Entry point
│
└── frontend/
    ├── public/          # Static files
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── context/     # React context
    │   ├── pages/       # Page components
    │   ├── utils/       # Utility functions
    │   ├── App.js       # Main component
    │   └── index.js     # Entry point
    └── package.json     # Frontend dependencies
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get a single customer
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get a single invoice
- `POST /api/invoices` - Create a new invoice
- `PUT /api/invoices/:id` - Update an invoice
- `DELETE /api/invoices/:id` - Delete an invoice
- `GET /api/invoices/:id/pdf` - Generate PDF for an invoice

### Payments
- `GET /api/payments/invoice/:invoiceId` - Get all payments for an invoice
- `POST /api/payments/invoice/:invoiceId` - Create a new payment
- `DELETE /api/payments/:id` - Delete a payment

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The pipeline:

1. Runs tests for both frontend and backend
2. Builds Docker images for both services
3. Pushes the images to Docker Hub
4. Deploys the application to a server using Docker Compose

### Setting Up the CI/CD Pipeline

To use the CI/CD pipeline, you need to add the following secrets to your GitHub repository:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password
- `SERVER_HOST`: The IP address or hostname of your EC2 instance
- `SERVER_USERNAME`: `ec2-user` (for Amazon Linux 2023)
- `SERVER_SSH_KEY`: The entire content of your .pem key file

### Setting Up the EC2 Instance

1. Launch an Amazon EC2 instance with Amazon Linux 2023
2. Connect to your EC2 instance using SSH:
   ```bash
   ssh -i "your-key.pem" ec2-user@your-ec2-public-ip
   ```

3. Install Docker and Docker Compose:
   ```bash
   # Update the system
   sudo yum update -y

   # Install Docker
   sudo yum install docker -y

   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker

   # Add your user to the docker group
   sudo usermod -aG docker ec2-user

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Log out and log back in for group changes to take effect
   exit
   ```

4. Reconnect to your EC2 instance and verify the installations:
   ```bash
   docker --version
   docker-compose --version
   ```

5. Configure your EC2 security group to allow:
   - SSH (port 22) from your IP address
   - HTTP (port 80) from anywhere (0.0.0.0/0)
   - HTTPS (port 443) from anywhere (0.0.0.0/0) if you plan to use SSL

### Docker Deployment

You can also deploy the application manually using Docker Compose:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## License

This project is licensed under the MIT License.