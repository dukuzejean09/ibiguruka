# Contributing to NeighborWatch Connect

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported in [Issues](https://github.com/your-username/ibiguruka/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Docker version, etc.)

### Suggesting Features

1. Check existing [Issues](https://github.com/your-username/ibiguruka/issues) and [Pull Requests](https://github.com/your-username/ibiguruka/pulls)
2. Create a new issue with:
   - Clear use case
   - Expected behavior
   - Why this would be useful

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
4. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**
   - Clear title and description
   - Link to related issues
   - Screenshots/GIFs for UI changes

## Development Setup

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Code Style

### Python (Backend)

- Follow [PEP 8](https://pep8.org/)
- Use type hints
- Document functions with docstrings
- Maximum line length: 100 characters

### JavaScript/React (Frontend)

- Use ES6+ features
- Functional components with hooks
- Use Tailwind CSS for styling
- Meaningful variable names
- Comment complex logic

### Commit Messages

Format: `Type: Brief description`

Types:

- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Update existing feature
- `Refactor:` Code refactoring
- `Docs:` Documentation changes
- `Style:` Code style changes (formatting, etc.)
- `Test:` Adding or updating tests
- `Chore:` Maintenance tasks

Examples:

```
Add: Voice input support for Kinyarwanda
Fix: Map not loading on mobile devices
Update: Improve clustering algorithm performance
Docs: Add API authentication examples
```

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Citizen can register and login
- [ ] Anonymous reporting works
- [ ] Reports appear on police dashboard
- [ ] Map loads correctly
- [ ] Clustering runs successfully
- [ ] Chat functionality works
- [ ] Admin can manage users
- [ ] Responsive design on mobile

### Automated Testing (Future)

We plan to add:

- Unit tests (Jest, pytest)
- Integration tests
- E2E tests (Playwright)

## Documentation

- Update README.md for new features
- Add API documentation for new endpoints
- Include code comments for complex logic
- Update INSTALLATION.md if setup changes

## Project Structure

```
ibiguruka/
├── frontend/              # React app
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # Layout components
│   │   ├── services/     # API clients
│   │   └── store/        # State management
│   └── Dockerfile
├── api/                   # FastAPI backend
│   ├── app/
│   │   ├── routes/       # API endpoints
│   │   ├── models.py     # Data models
│   │   ├── database.py   # DB connection
│   │   └── auth.py       # Authentication
│   └── Dockerfile
├── backend/
│   └── clustering/        # DBSCAN service
└── docker-compose.yml
```

## Priority Areas

Help is especially welcome in:

1. **Frontend UI/UX improvements**
2. **Mobile responsiveness**
3. **API performance optimization**
4. **Clustering algorithm tuning**
5. **Documentation and examples**
6. **Internationalization (Kinyarwanda translations)**
7. **Accessibility features**
8. **Security enhancements**

## Questions?

- Open a [Discussion](https://github.com/your-username/ibiguruka/discussions)
- Contact maintainers
- Check existing documentation

Thank you for contributing to make Rwanda safer! 🇷🇼
