# Project Architecture

This document describes the architectural structure and design principles of the project in detail.

## Architectural Principles

The project is developed based on the following architectural principles:

1. **Modularity**: Each component focuses on its own responsibility and is developed in separate files.
2. **Single Responsibility Principle (SRP)**: Each module, class, or function has a single responsibility.
3. **Dependency Inversion Principle (DIP)**: High-level modules are not dependent on low-level modules.
4. **Interface Segregation Principle (ISP)**: Components are not dependent on interfaces they do not need.
5. **Open/Closed Principle (OCP)**: Components can be extended without modification.

## Frontend Architecture

The frontend architecture consists of the following layers:

### 1. Component Layer

The component layer includes React components that make up the user interface. Each component is organized in its own folder and follows this structure:

```
ComponentName/
├── components/     # Subcomponents
├── hooks/          # Component-specific hooks
├── styles.ts       # Styled components
├── types.ts        # TypeScript types
└── index
```

#### Component Modularization Strategy

Components are modularized based on the following strategy:

1. **Atomic Design**: Components are organized based on the atomic design principle:
   - **Atoms**: Smallest components like buttons, inputs, etc.
   - **Molecules**: Components formed by combining atoms (e.g., form groups)
   - **Organisms**: Complex components formed by combining molecules (e.g., Terminal, Watchlist)
   - **Templates**: Components that form the structure of pages
   - **Pages**: Components that represent full pages

2. **Component Hierarchy**: Components are organized in a hierarchical structure:
   - Main component (`index.tsx`), coordinates subcomponents
   - Subcomponents (`components/`), create specific UI parts
   - Hooks (`hooks/`), manage component state and behavior

### 2. State Management Layer

State management is implemented using the following approaches:

1. **Local State**: React's `useState` hook is used for component-specific states
2. **Component State**: Special hooks (`useTerminal`, `useWatchlist`, etc.) are used to manage component state
3. **Global State**: React Context API is used for shared states in the application (`AuthContext`, etc.)

### 3. Service Layer

The service layer handles communication with external APIs and data sources:

```
services/
├── api/                # API services
│   ├── auth.ts         # Authentication service
│   ├── config.ts       # API configuration
│   ├── positions.ts    # Positions service
│   ├── terminal.ts     # Terminal service
│   ├── user.ts         # User service
│   ├── watchlist.ts    # Watchlist service
│   ├── websocket.ts    # WebSocket connections
│   └── index.ts        # File exporting all API services
└── api.ts              # For backward compatibility
```

#### API Modularization Strategy

API services are modularized based on the following strategy:

1. **Service Separation**: Each API service focuses on a specific functionality
2. **Configuration Separation**: API configuration (`config.ts`) is separated from services
3. **Export Strategy**: All services are exported in the `index.ts` file

### 4. Style Layer

The style layer organizes CSS styles in a modular way:

```
styles/
├── reset.css          # Reset styles
├── typography.css     # Typography styles
├── layout.css         # Layout styles
├── buttons.css        # Button styles
├── forms.css          # Form styles
├── auth.css           # Authentication page styles
├── home.css           # Main page styles
├── profile.css        # Profile page styles
├── responsive.css     # Responsive design styles
└── index.css          # File importing all CSS modules
```

#### CSS Modularization Strategy

CSS styles are modularized based on the following strategy:

1. **Functional Separation**: Styles are organized in separate files based on their functionality
2. **Basic Styles**: Basic styles (`reset.css`, `typography.css`, `layout.css`), used in the entire application
3. **Component Styles**: Component-specific styles (`buttons.css`, `forms.css`), used in related components
4. **Page Styles**: Page-specific styles (`auth.css`, `home.css`, `profile.css`), used in related pages
5. **Responsive Design**: Responsive design styles (`responsive.css`), organized in a separate file

## Backend Architecture

The backend architecture consists of the following layers:

### 1. Route Layer

The route layer defines API endpoints and directs requests to the appropriate controller.

### 2. Controller Layer

The controller layer handles API requests and implements business logic using the service layer.

### 3. Service Layer

The service layer contains business logic and uses the model layer to perform database operations.

### 4. Model Layer

The model layer contains database schemas and database operations.

## Data Flow

The data flow in the application is as follows:

1. User performs an action (e.g., clicking a button)
2. Component calls the relevant hook function
3. Hook sends a request to the backend via the API service if needed
4. Backend processes the request and returns a response
5. Hook processes the response and updates the component state
6. Component re-renders using the updated state

## File Naming Rules

A consistent file naming strategy has been used throughout the project:

1. **Components**: PascalCase (e.g., `TerminalHeader.tsx`)
2. **Hooks**: camelCase, "use" prefix (e.g., `useTerminal.ts`)
3. **Services**: camelCase (e.g., `watchlist.ts`)
4. **Styles**: camelCase (e.g., `buttons.css`)
5. **Types**: camelCase (e.g., `types.ts`)

## Code Organization

Code organization is based on the following principles:

1. **Grouping Related Code**: Related code is grouped together in the same folder
2. **Explicit Dependencies**: Dependencies are explicitly imported at the top of the file
3. **Consistent Structure**: Similar components are organized in a consistent structure
4. **Minimum Dependencies**: Dependencies between components are minimized

## Extending Strategy

The following strategies can be used to extend the project:

1. **Adding New Component**: New components can be added following the existing modular structure
2. **Adding New API Service**: New services can be added following the existing API structure
3. **Adding New Style**: New styles can be added following the existing style structure
4. **Adding New Page**: New pages can be added following the existing page structure

## Performance Optimization

The following strategies have been used for performance optimization:

1. **Code Splitting**: Large components are split into smaller parts
2. **Lazy Loading**: Pages are loaded when needed
3. **Memoization**: React.memo and useMemo are used to prevent unnecessary re-renders
4. **CSS Optimization**: CSS files are organized in a modular structure

## Test Strategy

The test strategy includes the following approaches:

1. **Unit Tests**: Unit tests for components and hooks
2. **Integration Tests**: Integration tests for interactions between components
3. **E2E Tests**: End-to-end tests for user scenarios

## Security Measures

Security measures include the following approaches:

1. **JWT Authentication**: JWT is used for user authentication
2. **API Key Encryption**: API keys are encrypted securely
3. **CORS Configuration**: CORS is configured securely
4. **Input Validation**: User inputs are validated both on the frontend and backend

## Conclusion

This architectural document describes the structure and design principles of the project in detail. New developers joining the project can quickly understand the project structure and contribute by using this document. 