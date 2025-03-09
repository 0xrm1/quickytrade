# OrionTrade Platform Backend

This is the backend API for the OrionTrade Platform, a trading platform with user authentication and API key management.

## Features

- User registration and authentication
- JWT-based session management
- Secure API key storage with AES encryption
- PostgreSQL database integration

## Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on the `.env.example` file
4. Set up your PostgreSQL database and update the `DATABASE_URL` in the `.env` file
5. Run the database schema:
   ```
   psql -U your_username -d your_database_name -f src/config/schema.sql
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user

### User Profile

- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/api-keys` - Update user's API keys (protected)
- `GET /api/users/api-keys` - Get user's API keys (protected)

### Health Check

- `GET /health` - Check server status

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ENCRYPTION_KEY` - Secret key for AES encryption

## Deployment

This application is configured for deployment on Render.com. 