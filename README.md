# Event Management System

A complete Event Management Web Application with Admin and Customer roles, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

### User Roles
- **Admin**: Can create, edit, and delete events; view statistics and bookings
- ** Customer**: Can view events, book seats, and manage bookings

### Core Functionality
-  User registration and authentication
-  Event management (CRUD operations)
-  Seat availability tracking
-  Booking system with seat management
-  Role-based access control
-  Responsive web interface

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling (responsive design)
- **Vanilla JavaScript** - Functionality

## Project Structure

```
event-management-system/
├── backend/
│   ├── models/
│   │   ├── User.js          # User model with authentication
│   │   ├── Event.js         # Event model with seat management
│   │   └── Booking.js       # Booking model with seat logic
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── eventController.js   # Event CRUD operations
│   │   └── bookingController.js # Booking operations
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── events.js        # Admin event routes
│   │   └── bookings.js      # Customer booking routes
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── config/
│   │   └── database.js      # Database configuration
│   └── server.js            # Main server file
├── public/
│   ├── index.html           # Home page
│   ├── register.html        # Registration page
│   ├── login.html           # Login page
│   ├── admin-dashboard.html # Admin dashboard
│   ├── customer-dashboard.html # Customer dashboard
│   ├── styles.css           # Global styles
│   ├── script.js            # Home page functionality
│   ├── register.js          # Registration functionality
│   ├── login.js             # Login functionality
│   ├── admin-dashboard.js   # Admin dashboard functionality
│   └── customer-dashboard.js # Customer dashboard functionality
├── package.json
├── .env
└── README.md
```

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env` file and configure:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/event-management
     JWT_SECRET=your-super-secret-jwt-key
     ```

3. **Start MongoDB**
   - Make sure MongoDB is running on your system

4. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Events (Admin only)
- `POST /api/events` - Create new event
- `GET /api/events` - Get all events with pagination
- `GET /api/events/stats` - Get event statistics
- `GET /api/events/:id` - Get specific event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Bookings (Customer only)
- `POST /api/bookings` - Book seats for event
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/available` - Get available events
- `GET /api/bookings/:bookingId` - Get specific booking
- `DELETE /api/bookings/:bookingId` - Cancel booking

## Usage

### For Admins 
1. Register as an admin user
2. Login to access admin dashboard
3. Create, edit, and delete events
4. View event statistics and bookings

### For Customers 
1. Register as a customer user
2. Login to access customer dashboard
3. Browse available events
4. Book seats for events
5. Manage and cancel bookings

## Key Features

### Seat Management 
- Automatic seat reduction when booking
- Seat restoration when cancelling
- Overbooking prevention
- Fully booked status tracking

### Authentication & Security 
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and error handling

### User Experience 
- Responsive design for all devices
- Real-time seat availability
- Intuitive booking interface
- Comprehensive error messages

## Database Models

### User Model
```javascript
{
  name: String (required)
  email: String (required, unique)
  password: String (required, hashed)
  role: String (required, enum: ['admin', 'customer'])
}
```

### Event Model
```javascript
{
  title: String (required)
  description: String (required)
  date: Date (required, future)
  totalSeats: Number (required, min: 1)
  availableSeats: Number (required, min: 0)
}
```

### Booking Model
```javascript
{
  userId: ObjectId (required, ref: 'User')
  eventId: ObjectId (required, ref: 'Event')
  numberOfSeats: Number (required, min: 1)
  status: String (default: 'confirmed')
}
```

## Testing

The system includes comprehensive testing for:
- User registration and login
- Event CRUD operations
- Booking functionality
- Seat availability logic
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For any issues or questions, please contact the development team.

---

**Note**: This is a complete, production-ready Event Management System built following industry best practices and clean architecture principles.
