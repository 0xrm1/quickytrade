# Trading Platform

A modern and modular trading platform. This platform allows users to trade cryptocurrencies, create watchlists, and track their positions.

## Project Structure

The project is organized in a modular structure. Each component focuses on its own responsibility and is developed in separate files.

### Folder Structure

```
frontend/
├── public/
└── src/
    ├── components/         # UI components
    │   ├── Terminal/       # Terminal component and sub-components
    │   │   ├── components/ # Terminal's sub-components
    │   │   ├── hooks/      # Hooks related to Terminal
    │   │   ├── styles.ts   # Terminal styles
    │   │   ├── types.ts    # Terminal types
    │   │   └── index.tsx   # Main Terminal component
    │   ├── Watchlist/      # Watchlist component and sub-components
    │   │   ├── components/ # Watchlist's sub-components
    │   │   ├── hooks/      # Hooks related to Watchlist
    │   │   ├── styles.ts   # Watchlist styles
    │   │   ├── types.ts    # Watchlist types
    │   │   └── index.tsx   # Main Watchlist component
    │   ├── Positions/      # Positions component
    │   └── QuickButtonsBar/# Quick buttons component
    ├── context/            # React contexts
    ├── pages/              # Page components
    ├── services/           # API services
    │   ├── api/            # Modular API services
    │   │   ├── auth.ts     # Authentication service
    │   │   ├── config.ts   # API configuration
    │   │   ├── positions.ts# Positions service
    │   │   ├── terminal.ts # Terminal service
    │   │   ├── user.ts     # User service
    │   │   ├── watchlist.ts# Watchlist service
    │   │   ├── websocket.ts# WebSocket connections
    │   │   └── index.ts    # File exporting all API services
    │   └── api.ts          # For backward compatibility
    ├── styles/             # CSS styles
    │   ├── reset.css       # Reset styles
    │   ├── typography.css  # Typography styles
    │   ├── layout.css      # Layout styles
    │   ├── buttons.css     # Button styles
    │   ├── forms.css       # Form styles
    │   ├── auth.css        # Authentication page styles
    │   ├── home.css        # Main page styles
    │   ├── profile.css     # Profile page styles
    │   ├── responsive.css  # Responsive design styles
    │   └── index.css       # File importing all CSS modules
    ├── App.tsx             # Main application component
    └── index.tsx           # Application entry point

backend/
├── controllers/           # Controllers for API endpoints
├── models/               # Database models
├── routes/               # API routes
├── services/             # Business logic services
└── index.js              # Server entry point
```

## Components

### Terminal

The Terminal component allows users to trade via command line interface.

- **File Path**: `frontend/src/components/Terminal/`
- **Sub-components**:
  - `TerminalHeader`: Terminal header and control buttons
  - `TerminalOutput`: Displays command outputs
  - `TerminalInput`: Input area for command input
  - `InfoTooltip`: Tooltip for command help
- **Hooks**:
  - `useTerminal`: Manages Terminal status and functions

### Watchlist

The Watchlist component allows users to list cryptocurrencies they want to watch.

- **File Path**: `frontend/src/components/Watchlist/`
- **Sub-components**:
  - `WatchlistHeader`: Header and control buttons
  - `WatchlistTabs`: Switches between different watchlists
  - `AddSymbolForm`: Form for adding a new symbol
  - `SymbolItem`: Each symbol item
  - `SymbolList`: Symbol list
  - `SettingsModal`: Settings modal
- **Hooks**:
  - `useWatchlist`: Manages Watchlist data and functions

### Positions

The Positions component allows users to view and manage their open positions.

- **File Path**: `frontend/src/components/Positions/`
- **Hooks**:
  - `usePositions`: Manages Positions data and functions
  - `usePriceData`: Manages price data

### QuickButtonsBar

The QuickButtonsBar component contains buttons for users to quickly perform trades.

- **File Path**: `frontend/src/components/QuickButtonsBar/`
- **Hooks**:
  - `useQuickButtons`: Manages Quick buttons data and functions

## API Services

API services allow frontend to communicate with backend.

- **File Path**: `frontend/src/services/api/`
- **Services**:
  - `auth.ts`: Authentication operations
  - `user.ts`: User profile operations
  - `watchlist.ts`: Watchlist operations
  - `terminal.ts`: Terminal commands
  - `positions.ts`: Positions operations
  - `quickButtons.ts`: Quick buttons operations
  - `websocket.ts`: WebSocket connections
  - `config.ts`: API configuration

## Styles

CSS styles are organized in a modular structure.

- **File Path**: `frontend/src/styles/`
- **Style Files**:
  - `reset.css`: Reset styles
  - `typography.css`: Typography styles
  - `layout.css`: Layout styles
  - `buttons.css`: Button styles
  - `forms.css`: Form styles
  - `auth.css`: Authentication page styles
  - `home.css`: Main page styles
  - `profile.css`: Profile page styles
  - `responsive.css`: Responsive design styles
  - `index.css`: File importing all CSS modules

## Frontend Features

- User registration and login
- Protected routes with authentication
- Profile management
- Binance API key management
- Responsive design

### Frontend Pages

- `/` - Main page
- `/login` - Login page
- `/register` - Registration page
- `/profile` - User profile page (protected)

### Frontend Environment Variables

Create a `.env` file in the root directory for frontend:

```
REACT_APP_API_URL=http://localhost:5000/api
```

For production, update the URL to your deployed backend API.

## Backend Features

- User registration and authentication
- JWT-based session management
- AES encryption for secure API key storage
- PostgreSQL database integration

### Backend API Endpoints

#### Authentication

- `POST /api/users/register` - New user registration
- `POST /api/users/login` - User login

#### User Profile

- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/api-keys` - Update user's API keys (protected)
- `GET /api/users/api-keys` - Get user's API keys (protected)

#### Health Check

- `GET /health` - Check server status

### Backend Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ENCRYPTION_KEY` - Secret key for AES encryption

## Setup and Run

### Requirements

- Node.js (v14 and above)
- PostgreSQL database
- npm or yarn

### Setup

```bash
# Clone the project
git clone <repo-url>

# Go to project directory
cd trading-platform

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Create .env file for backend
# Create .env file based on .env.example and update values

# Install PostgreSQL and run schema
psql -U kullanici_adiniz -d veritabani_adiniz -f src/config/schema.sql
```

### Run Development Environment

```bash
# Run backend
cd backend
npm run dev

# Open a new terminal and run frontend
cd frontend
npm start
```

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Run backend in production mode
cd ../backend
npm start
```

## Deployment

This application is configured for deployment on Render.com.

### Backend Deployment (Render.com)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Select backend directory
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables in your .env file
7. Create a PostgreSQL database on Render and connect it

### Frontend Deployment (Render.com)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Select frontend directory
4. Set build command: `npm run build`
5. Set publish directory: `build`
6. Add environment variable: `REACT_APP_API_URL=https://backend-url.onrender.com/api`

## Development Guide

### Adding New Component

When adding a new component, follow the existing modular structure:

1. Create a new folder for the component: `frontend/src/components/YeniBileşen/`
2. If needed, create a `components/` folder for sub-components
3. If needed, create a `hooks/` folder for hooks
4. Create a `types.ts` file for type definitions
5. Create a `styles.ts` file for style definitions
6. Create an `index.tsx` file for the main component

### Adding New API Service

When adding a new API service:

1. Create a new file in the `frontend/src/services/api/` folder
2. Export the service in the `index.ts` file

### Adding New Style

When adding a new style:

1. Create a new file in the `frontend/src/styles/` folder
2. Import the style in the `index.css` file

## Contributing

To contribute to the project:

1. Create a fork
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push your branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

For more information, see the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Architecture

For more information about the project's architecture and design principles, see the [ARCHITECTURE.md](ARCHITECTURE.md) file.

## License

This project is licensed under the [MIT License](LICENSE). 