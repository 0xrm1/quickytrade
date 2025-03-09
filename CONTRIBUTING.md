# Contribution Guide

This document is a guide for those who want to contribute to the project. Please read this document before contributing to the project.

## Before You Start

Before contributing to the project, it is recommended that you read the following documents:

- [README.md](README.md): General information about the project
- [ARCHITECTURE.md](ARCHITECTURE.md): The architectural structure of the project

## Development Environment Setup

1. Fork the project
2. Clone it to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/trading-platform.git
   cd trading-platform
   ```
3. Install dependencies:
   ```bash
   # Frontend dependencies
   cd frontend
   npm install

   # Backend dependencies
   cd ../backend
   npm install
   ```
4. Start the development environment:
   ```bash
   # Start the backend
   cd backend
   npm run dev

   # Open a new terminal and start the frontend
   cd frontend
   npm start
   ```

## Coding Rules

### General Rules

1. **Clean Code**: Your code should be clean, readable, and understandable.
2. **Modularity**: Your code should be modular and follow the existing modular structure.
3. **Single Responsibility**: Each function and component should have a single responsibility.
4. **Descriptive Naming**: Variables, functions, and components should have descriptive names.
5. **Comments**: Add comments explaining complex code blocks.

### Frontend Rules

1. **Component Structure**: New components should follow the existing modular structure:
   ```
   ComponentName/
   ├── components/     # Subcomponents
   ├── hooks/          # Component-specific hooks
   ├── styles.ts       # Styled components
   ├── types.ts        # TypeScript types
   └── index.tsx       # Main component
   ```
2. **TypeScript**: All new code must be written with TypeScript.
3. **Style Rules**: CSS styles should follow the modular structure.
4. **Responsive Design**: All UI components must be responsive.

### Backend Rules

1. **API Structure**: New API endpoints should follow the existing structure.
2. **Error Management**: All error conditions should be handled appropriately.
3. **Validation**: All user inputs must be validated.
4. **Security**: Security is the top priority.

## Commit Messages

Commit messages should be in the following format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:

```
feat(watchlist): add new filter functionality

- Add filter by price range
- Add filter by price change
- Update UI to include filter controls

Closes #123
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Only documentation changes
- **style**: Code changes that do not affect the code behavior (e.g., formatting, whitespace, etc.)
- **refactor**: Code changes that do not fix bugs or add features
- **perf**: Performance improvements
- **test**: Test addition or correction
- **chore**: Build changes, dependency updates, etc.

## Pull Request Process

1. Create a new branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat(component): add amazing feature"
   ```
3. Push your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
4. Create a Pull Request on GitHub
5. Your Pull Request will be reviewed and, if necessary, changes may be requested
6. Once your changes are complete, your Pull Request will be merged into the main branch

## Code Review Process

All Pull Requests should be reviewed by at least one person. The code review process is as follows:

1. Is the code consistent with the project's overall structure and coding rules?
2. Does the code correctly implement the specified functionality?
3. Is the code appropriate in terms of performance and security?
4. Is the code sufficiently tested?

## Test Process

All new features and bug fixes should be supported by appropriate tests:

1. **Unit Tests**: Unit tests for components and hooks
2. **Integration Tests**: Integration tests for interactions between components
3. **E2E Tests**: End-to-end tests for user scenarios

## Version Management

The project follows the principles of [Semantic Versioning](https://semver.org/):

- **MAJOR**: Backward-incompatible API changes
- **MINOR**: Backward-compatible new functionality
- **PATCH**: Backward-compatible bug fixes

## Contact

For questions or suggestions, please create a GitHub issue or contact the project managers.

## Thanks

Thanks for contributing to the project! Your contributions will help the project grow. 