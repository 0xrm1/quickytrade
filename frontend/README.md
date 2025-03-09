# OrionTrade Platform Frontend

This is the frontend application for the OrionTrade Platform, a trading platform with user authentication and API key management.

## Features

- User registration and login
- Protected routes with authentication
- Profile management
- Binance API key management
- Responsive design

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Backend API running

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Update the API URL in `src/services/api.ts` if needed

### Running the Application

Development mode:
```
npm start
```

Build for production:
```
npm run build
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
```

For production, update the URL to your deployed backend API.

## Pages

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/profile` - User profile page (protected)

## Deployment

This application is configured for deployment on Render.com. You can deploy it as a static site.
