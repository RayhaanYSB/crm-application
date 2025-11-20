# CRM Application

A full-stack Customer Relationship Management system built with React, Node.js, Express, and PostgreSQL.

## Features

### Core Functionality
- ✅ **Client Management** - Track client information, contacts, and relationships
- ✅ **Product Management** - Manage product catalog with pricing and inventory
- ✅ **Lead Management** - Track and convert leads through the sales pipeline
- ✅ **Opportunity Management** - Manage sales opportunities and forecasting
- ✅ **Quotation System** - Create and generate PDF quotations
- ✅ **User Management** - Role-based access control with granular permissions

### Security & Access Control
- 🔐 JWT-based authentication
- 👥 Two user roles: Admin and Standard User
- 🔑 Granular permission system for each module
- 🛡️ Protected routes and API endpoints

### User Interface
- 🎨 Dark and Light mode support
- 📱 Responsive design for mobile and desktop
- 🍔 Burger menu navigation with permission-based visibility
- 🎯 Clean and modern UI with intuitive navigation

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Python/ReportLab** for PDF generation

### Frontend
- **React** 18
- **React Router** for navigation
- **Axios** for API calls
- **React Icons** for UI icons
- **Context API** for state management

## Project Structure

```
crm-app/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── middleware/
│   │   └── auth.js              # Authentication & permission middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── clients.js           # Client CRUD routes
│   │   ├── products.js          # Product CRUD routes
│   │   ├── leads.js             # Lead CRUD routes
│   │   ├── opportunities.js     # Opportunity CRUD routes
│   │   └── quotations.js        # Quotation & PDF routes
│   ├── scripts/
│   │   ├── initDatabase.js      # Database initialization
│   │   └── generatePDF.py       # PDF generation script
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Main server file
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js        # Navigation with burger menu
    │   │   ├── Navbar.css
    │   │   └── ProtectedRoute.js # Route protection
    │   ├── context/
    │   │   ├── AuthContext.js   # Authentication state
    │   │   └── ThemeContext.js  # Theme management
    │   ├── pages/
    │   │   ├── Login.js         # Login page
    │   │   ├── Dashboard.js     # Main dashboard
    │   │   └── PlaceholderPage.js # Module placeholders
    │   ├── services/
    │   │   └── api.js           # API service layer
    │   ├── App.js               # Main app component
    │   ├── App.css              # Global styles with themes
    │   └── index.js             # Entry point
    ├── .env.example
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Python 3 (for PDF generation)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb crm_db

# Or using psql
psql -U postgres
CREATE DATABASE crm_db;
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Install Python dependencies for PDF generation
pip3 install reportlab --break-system-packages

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials

# Initialize database with schema and default users
npm run init-db

# Start backend server
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Default API URL is already set to http://localhost:5000/api

# Start frontend development server
npm start
```

The frontend will run on `http://localhost:3000`

## Default Credentials

After running the database initialization, you can log in with:

**Admin User:**
- Username: `admin`
- Password: `admin123`
- Has full access to all modules and permissions

**Standard User:**
- Username: `user`
- Password: `user123`
- Has view-only access to basic modules

## Permission System

The application includes granular permissions for each module:

### Client Permissions
- `view_clients` - View client list and details
- `create_clients` - Create new clients
- `edit_clients` - Edit existing clients
- `delete_clients` - Delete clients

### Product Permissions
- `view_products` - View product list and details
- `create_products` - Create new products
- `edit_products` - Edit existing products
- `delete_products` - Delete products

### Lead Permissions
- `view_leads` - View lead list and details
- `create_leads` - Create new leads
- `edit_leads` - Edit existing leads
- `delete_leads` - Delete leads

### Opportunity Permissions
- `view_opportunities` - View opportunity list and details
- `create_opportunities` - Create new opportunities
- `edit_opportunities` - Edit existing opportunities
- `delete_opportunities` - Delete opportunities

### Quotation Permissions
- `view_quotations` - View quotation list and details
- `create_quotations` - Create new quotations
- `edit_quotations` - Edit existing quotations
- `delete_quotations` - Delete quotations
- `generate_pdf` - Generate PDF quotations

### Admin Permissions
- `manage_users` - Manage user accounts
- `manage_permissions` - Manage user permissions
- `view_reports` - View analytics and reports

**Note:** Admin users automatically have all permissions regardless of explicit grants.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh JWT token

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/permissions/all` - Get all available permissions
- `PUT /api/users/:id/permissions` - Update user permissions

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Opportunities
- `GET /api/opportunities` - Get all opportunities
- `GET /api/opportunities/:id` - Get opportunity by ID
- `POST /api/opportunities` - Create new opportunity
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity

### Quotations
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get quotation by ID
- `POST /api/quotations` - Create new quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation
- `GET /api/quotations/:id/pdf` - Generate and download PDF

## Development Workflow

### Adding New Features

1. **Backend:**
   - Add route in `backend/routes/`
   - Implement middleware if needed
   - Add appropriate permission checks
   - Test API endpoints

2. **Frontend:**
   - Create page component in `src/pages/`
   - Add route in `App.js`
   - Add API service call in `src/services/api.js`
   - Update navigation in `Navbar.js` if needed

3. **Permissions:**
   - Add new permission in `backend/scripts/initDatabase.js`
   - Grant to appropriate users
   - Add permission check in routes

## Theme Customization

The application supports dark and light themes. Theme variables are defined in `frontend/src/App.css`:

```css
:root[data-theme="light"] {
  --primary-color: #3182ce;
  --bg-primary: #ffffff;
  --text-primary: #2d3748;
  /* ... more variables */
}

:root[data-theme="dark"] {
  --primary-color: #4299e1;
  --bg-primary: #1a202c;
  --text-primary: #f7fafc;
  /* ... more variables */
}
```

## Next Steps

Now that the framework is set up, you can:

1. **Implement CRUD interfaces** for each module (Clients, Products, Leads, etc.)
2. **Build the quotation builder** with line items and calculations
3. **Enhance the PDF generator** with company branding and custom templates
4. **Add reporting and analytics** dashboard
5. **Implement search and filtering** for all list views
6. **Add data export** capabilities (CSV, Excel)
7. **Implement email notifications** for quotations
8. **Add activity logging** and audit trails

## Support

For issues or questions, please refer to the inline code comments or create an issue in the repository.

## License

This project is private and proprietary.
