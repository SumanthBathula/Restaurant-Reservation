# Restaurant Reservation Management System

A full-stack web application for managing restaurant table reservations with role-based access control for customers and administrators.

## 🚀 Live Demo

- **URL**: [https://restaurant-reservation-pearl.vercel.app/]

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Key Design Decisions](#key-design-decisions)
- [Reservation Logic](#reservation-logic)
- [Role-Based Access Control](#role-based-access-control)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

## ✨ Features

### Customer Features
- User registration and authentication
- Check table availability by date, time, and party size
- Create table reservations
- View personal reservation history
- Cancel own reservations

### Administrator Features
- View all reservations in the system
- Filter reservations by date
- Update any reservation (change table, time, date, guest count)
- Cancel any reservation
- Add new tables to the system
- View all restaurant tables

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Protected API routes

## 🛠 Technology Stack

### Frontend
- **React 18** - UI library
- **CSS3** - Styling
- **Fetch API** - HTTP requests

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas account)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/restaurant-reservation
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-reservation?retryWrites=true&w=majority
```

4. Start the server:
```bash
npm start
# Or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production, use your deployed backend URL:
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
restaurant-reservation/
├── backend/
│   ├── server.js          # Main server file with all routes and logic
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
│
└── frontend/
    ├── public/
    │   └── index.html     # HTML template
    ├── src/
    │   ├── App.jsx        # Main React component with all functionality
    │   ├── App.css        # Complete styling
    │   ├── index.js       # React entry point
    │   └── index.css      # Base styles
    ├── package.json       # Frontend dependencies
    └── .env.example       # Environment variables template
```

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer" // or "admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Table Endpoints

#### Get All Tables
```http
GET /api/tables
Authorization: Bearer <token>
```

#### Check Available Tables
```http
GET /api/tables/available?date=2024-12-31&timeSlot=19:00&guests=4
Authorization: Bearer <token>
```

### Reservation Endpoints (Customer)

#### Create Reservation
```http
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "tableId": "64abc123...",
  "reservationDate": "2024-12-31",
  "timeSlot": "19:00",
  "numberOfGuests": 4
}
```

#### Get My Reservations
```http
GET /api/reservations/my
Authorization: Bearer <token>
```

#### Cancel My Reservation
```http
PATCH /api/reservations/:id/cancel
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Reservations
```http
GET /api/admin/reservations?date=2024-12-31
Authorization: Bearer <admin-token>
```

#### Cancel Any Reservation
```http
PATCH /api/admin/reservations/:id/cancel
Authorization: Bearer <admin-token>
```

#### Update Reservation
```http
PATCH /api/admin/reservations/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "tableId": "64abc123...",
  "reservationDate": "2024-12-31",
  "timeSlot": "20:00",
  "numberOfGuests": 6
}
```

#### Create Table
```http
POST /api/admin/tables
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "tableNumber": 10,
  "capacity": 4
}
```

## 🎯 Key Design Decisions

### Database Schema

**User Schema:**
- Fields: name, email, password (hashed), role, createdAt
- Role enum: 'customer' | 'admin'
- Email is unique and indexed

**Table Schema:**
- Fields: tableNumber (unique), capacity, isAvailable
- Pre-seeded with 8 tables of varying capacities (2, 4, 6, 8 seats)

**Reservation Schema:**
- Fields: userId, tableId, reservationDate, timeSlot, numberOfGuests, status, createdAt
- Status enum: 'active' | 'cancelled'
- Compound index on (tableId, reservationDate, timeSlot, status) for efficient conflict checking
- References User and Table collections

### Architecture Decisions

1. **Monolithic Backend**: All routes and logic in a single `server.js` file for simplicity and easy deployment
2. **Single-Page Frontend**: Complete React app in `App.jsx` with component-based architecture
3. **JWT Authentication**: Stateless authentication with 7-day token expiration
4. **Role-Based Views**: Conditional rendering based on user role
5. **Pessimistic Locking**: Check availability before creating reservation to prevent conflicts

## 🔒 Reservation Logic

### Availability Algorithm

The system ensures no double bookings through the following logic:

1. **Capacity Check**: Only shows tables with capacity >= requested guest count
2. **Conflict Detection**: 
   - Queries existing reservations for the same date and time slot
   - Filters out already-booked tables
   - Returns only truly available tables
3. **Atomic Creation**: When creating a reservation, the system:
   - Re-validates table capacity
   - Checks for conflicts (same table, date, time, status='active')
   - Returns 409 Conflict if table is already booked
   - Creates reservation only if all checks pass

### Validation Rules

- **Date**: Must be today or future date in YYYY-MM-DD format
- **Time**: Must be in HH:MM 24-hour format
- **Guests**: Between 1 and 20 people
- **Table Capacity**: Must accommodate the number of guests
- **No Overlap**: Same table cannot have multiple active reservations for the same date/time

### Edge Cases Handled

- Concurrent booking attempts (database-level conflict prevention)
- Past date bookings (rejected)
- Invalid time formats (rejected)
- Capacity mismatches (rejected)
- Cancelled reservations (excluded from availability checks)

## 👥 Role-Based Access Control

### Customer Role
- Can only view their own reservations
- Can only cancel their own reservations
- Cannot access admin endpoints
- Cannot modify other users' reservations

### Admin Role
- Full visibility of all reservations
- Can cancel any reservation
- Can update any reservation (change table, time, guests)
- Can filter reservations by date
- Can add new tables to the system
- Cannot access another user's password or modify user accounts

### Authorization Implementation

1. **Authentication Middleware**: Validates JWT token and attaches user to request
2. **Authorization Middleware**: Checks user role before allowing access to admin routes
3. **Resource Ownership**: Customers can only access their own reservations through userId filtering
4. **HTTP Status Codes**: 
   - 401 for authentication failures
   - 403 for authorization failures (wrong role)
   - 404 for resources not found

## ⚠️ Known Limitations

1. **Single Restaurant**: System currently supports only one restaurant
2. **Fixed Time Slots**: No duration management (assumed 2-hour slots)
3. **No Real-time Updates**: Reservation changes don't push to other users automatically
4. **No Email Notifications**: Users aren't notified of reservation confirmations/cancellations
5. **No Payment Integration**: No deposit or payment processing
6. **Basic Table Management**: Cannot delete tables or mark them as unavailable
7. **No Waitlist**: No queue system for fully booked time slots
8. **Limited Time Validation**: Doesn't prevent booking after restaurant hours
9. **No Recurring Reservations**: Cannot create weekly/monthly recurring bookings
10. **Simple Conflict Resolution**: First-come-first-served, no priority system

## 🚀 Future Improvements

### High Priority
1. **Real-time Updates**: WebSocket integration for live availability updates
2. **Email Notifications**: Send confirmation and reminder emails
3. **Multi-Restaurant Support**: Extend to support multiple restaurant locations
4. **Table Duration**: Add reservation duration field and automatic release
5. **Advanced Table Management**: 
   - Mark tables as unavailable/under maintenance
   - Delete tables with validation
   - Table categories (indoor, outdoor, private)

### Medium Priority
6. **Enhanced Search**: Filter by capacity, location, or availability range
7. **Reservation History**: Detailed analytics and reporting for admins
8. **Customer Profiles**: Save favorite tables, dietary preferences
9. **Waitlist System**: Queue management when fully booked
10. **Business Hours**: Configure restaurant hours and prevent off-hours bookings

### Low Priority
11. **Payment Integration**: Deposit or pre-payment for reservations
12. **SMS Notifications**: Text message reminders
13. **Recurring Reservations**: Weekly/monthly booking patterns
14. **QR Code Check-in**: Generate QR codes for reservation verification
15. **Rating System**: Post-dining feedback and reviews
16. **Table Combinations**: Automatically combine tables for large parties
17. **Special Requests**: Notes field for dietary restrictions, occasions
18. **Mobile App**: Native iOS/Android applications
19. **Social Integration**: Share reservations, invite friends
20. **AI Recommendations**: Suggest optimal tables based on history

## 🔐 Security Considerations

- All passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 7 days
- Environment variables used for sensitive data
- Input validation on all endpoints
- MongoDB injection prevention through Mongoose
- CORS enabled for cross-origin requests
- No sensitive data in error messages

## 📝 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Register new customer
- [ ] Register new admin
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token persistence across page reloads

**Customer Flow:**
- [ ] Check availability for future date
- [ ] Check availability for past date (should fail)
- [ ] Create reservation for available table
- [ ] Try creating duplicate reservation (should fail)
- [ ] View personal reservations
- [ ] Cancel own reservation
- [ ] Try canceling already-cancelled reservation (should fail)

**Admin Flow:**
- [ ] View all reservations
- [ ] Filter reservations by date
- [ ] Cancel any reservation
- [ ] Update reservation details
- [ ] Try updating to create conflict (should fail)
- [ ] Add new table
- [ ] Add duplicate table number (should fail)

## 📄 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/restaurant-reservation
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚢 Deployment Guide

### Backend Deployment (Railway/Render)

1. Create a new Web Service
2. Connect your GitHub repository
3. Set environment variables:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (random secure string)
   - `PORT` (usually auto-detected)
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Create a new site
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add environment variable:
   - `REACT_APP_API_URL` (your deployed backend URL + /api)
6. Deploy

### MongoDB Atlas Setup

1. Create a free cluster at mongodb.com
2. Create a database user
3. Whitelist your IP (or 0.0.0.0/0 for all IPs)
4. Get connection string and add to backend .env

## 📞 Support

For issues or questions, please create an issue in the GitHub repository.

## 👨‍💻 Author

[Your Name]

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This project was created as part of a technical assignment to demonstrate full-stack development skills. It includes authentication, role-based access control, database design, and business logic implementation.