# OrionTrade Platform

OrionTrade Platform is a full-stack trading application with user authentication and API key management for Binance integration.

## Project Structure

This project consists of two main parts:

- `backend/` - Node.js/Express.js API with PostgreSQL database
- `frontend/` - React TypeScript application

## Features

- User registration and authentication
- JWT-based session management
- Secure API key storage with AES encryption
- Profile management
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and update the values

4. Set up your PostgreSQL database and run the schema:
   ```
   psql -U your_username -d your_database_name -f src/config/schema.sql
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the `.env` file if needed

4. Start the development server:
   ```
   npm start
   ```

## Deployment

### Backend Deployment (Render.com)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Select the backend directory
4. Set the build command: `npm install`
5. Set the start command: `npm start`
6. Add environment variables from your `.env` file
7. Create a PostgreSQL database on Render and connect it

### Frontend Deployment (Render.com)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Select the frontend directory
4. Set the build command: `npm run build`
5. Set the publish directory: `build`
6. Add the environment variable: `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 