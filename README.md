# Appointment Booking Application

A modern, production-ready full-stack web application for managing appointments and office scheduling. Built with FastAPI, Next.js, and PostgreSQL, featuring comprehensive authentication, role-based access control, and a professional admin dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

## Overview

This application provides a complete solution for appointment booking and office management with:

- **Multi-tenant office management** with customizable scheduling
- **Role-based access control (RBAC)** with admin, staff, and user roles
- **Secure authentication** using JWT tokens with refresh token rotation
- **Professional admin dashboard** for user and office management
- **Responsive design** with dark mode support
- **Production-ready deployment** with Docker and Nginx

## Technology Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com)** - Modern Python web framework
  - **[SQLModel](https://sqlmodel.tiangolo.com)** - SQL ORM with Pydantic integration
  - **[PostgreSQL](https://www.postgresql.org)** - Relational database
  - **[Pydantic](https://docs.pydantic.dev)** - Data validation and settings management
  - **[Alembic](https://alembic.sqlalchemy.org)** - Database migrations
  - **[Pytest](https://pytest.org)** - Testing framework

### Frontend
- **[Next.js](https://nextjs.org)** - React framework with TypeScript
  - **[React 18+](https://react.dev)** - UI library
  - **[TanStack Query](https://tanstack.com/query)** - Server state management
  - **[TanStack Router](https://tanstack.com/router)** - Client-side routing
  - **[Chakra UI](https://chakra-ui.com)** - Component library
  - **[NextAuth.js](https://next-auth.js.org)** - Authentication
  - **[Playwright](https://playwright.dev)** - E2E testing

### Infrastructure
- **[Docker Compose](https://www.docker.com)** - Container orchestration
- **[Nginx](https://nginx.org)** - Reverse proxy and load balancer
- **[Redis](https://redis.io)** - Caching and session management
- **[Mailpit](https://mailpit.axllent.org)** - Email testing (development)

## Key Features

### Authentication & Security
- ✅ JWT-based authentication with secure token refresh
- ✅ CSRF protection with double-submit cookie pattern
- ✅ Secure password hashing (bcrypt)
- ✅ Email-based password recovery
- ✅ Role-based access control (RBAC)
- ✅ User verification and activation workflows

### Admin Dashboard
- 👥 User management (create, edit, deactivate, suspend)
- 🏢 Office management with location tracking
- 📊 User statistics and activity monitoring
- 🔐 Role and permission assignment
- 📧 Email invitation system

### Appointment Management
- 📅 Office-based scheduling
- 🕐 Time slot management
- 👤 Host assignment and availability
- 📝 Appointment tracking and history

### Developer Experience
- 🔄 Hot-reload development environment
- 📚 Auto-generated API documentation (Swagger UI)
- 🧪 Comprehensive test suite
- 🐛 VS Code debugger integration
- 📝 Structured logging with JSON output

## Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- **Python 3.11+** (for local development)
- **Node.js 20+** (for frontend development)
- **uv** (Python package manager, optional but recommended)

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd appointment_app
   ```

2. **Configure environment variables**
   ```bash
   # Copy the example .env file
   cp .env.example .env

   # Update critical values in .env:
   # - SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
   # - FIRST_SUPERUSER_PASSWORD
   # - POSTGRES_PASSWORD
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - API Documentation: http://localhost/docs
   - Admin Email: admin@gmail.com (default)
   - Admin Password: Check your `.env` file

### Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate

# Run migrations
alembic upgrade head

# Start development server
fastapi run --reload app/main.py
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Project Structure

```
appointment_app/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication & RBAC
│   │   ├── core/              # Core utilities (security, middleware)
│   │   ├── models.py          # SQLModel definitions
│   │   ├── crud.py            # Database operations
│   │   └── main.py            # Application entry point
│   ├── tests/                 # Test suite
│   ├── alembic/               # Database migrations
│   ├── Dockerfile             # Backend container
│   └── pyproject.toml         # Python dependencies
│
├── frontend/                   # Next.js application
│   ├── app/                   # Next.js app directory
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── helpers/               # Utilities and API client
│   ├── hooks/                 # Custom React hooks
│   ├── Dockerfile             # Frontend container
│   └── package.json           # Node dependencies
│
├── docker-compose.yml         # Service orchestration
├── nginx.conf                 # Reverse proxy configuration
└── .env                       # Environment variables
```

## Documentation

### Detailed Guides

- **[Backend Documentation](./backend/README.md)** - API development, testing, migrations, and deployment
- **[Frontend Documentation](./frontend/README.md)** - UI development and component usage
- **[Development Guide](./development.md)** - Local development setup and workflows
- **[Deployment Guide](./deployment.md)** - Production deployment instructions

### API Documentation

Once the application is running, access the interactive API documentation:

- **Swagger UI**: http://localhost/docs
- **ReDoc**: http://localhost/redoc
- **OpenAPI Schema**: http://localhost/openapi.json

### Environment Configuration

Key environment variables to configure:

| Variable | Purpose | Example |
|----------|---------|---------|
| `SECRET_KEY` | JWT signing key | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ENVIRONMENT` | Deployment environment | `local`, `development`, `staging`, `production` |
| `FRONTEND_HOST` | Frontend URL for links | `http://localhost` or `https://example.com` |
| `POSTGRES_PASSWORD` | Database password | Generate a secure password |
| `FIRST_SUPERUSER` | Admin email | `admin@example.com` |
| `FIRST_SUPERUSER_PASSWORD` | Admin password | Secure password |
| `SMTP_HOST` | Email server | `smtp.gmail.com` or `mailpit` (dev) |

See `.env` file for complete configuration options.

## Common Tasks

### Running Tests

```bash
# Backend tests
cd backend
bash scripts/test.sh

# Frontend E2E tests
cd frontend
pnpm test:e2e
```

### Database Migrations

```bash
# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback last migration
docker compose exec backend alembic downgrade -1
```

### Accessing Services

```bash
# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh

# Database shell
docker compose exec db psql -U postgres -d app

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Generating Secret Keys

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Architecture

### Authentication Flow

1. User logs in with email/password
2. Backend validates credentials and issues JWT tokens
3. Access token stored in memory, refresh token in httpOnly cookie
4. CSRF token issued for double-submit protection
5. Subsequent requests include access token in Authorization header
6. Token refresh handled automatically via refresh endpoint

### API Architecture

- **RESTful API** with standard HTTP methods
- **Role-based access control** enforced at endpoint level
- **Request/response validation** using Pydantic models
- **Structured error responses** with detailed error messages
- **Rate limiting** on sensitive endpoints
- **CORS** configured for frontend origin

### Database Schema

- **Users** - User accounts with roles and permissions
- **Offices** - Office locations with scheduling configuration
- **Appointments** - Booking records with time slots
- **Roles & Permissions** - RBAC configuration
- **Token Denylist** - Revoked tokens for logout

## Performance & Security

### Performance Optimizations
- Database query optimization with indexed lookups
- Redis caching for frequently accessed data
- Connection pooling for database and Redis
- Gzip compression for API responses
- Static asset caching with proper headers

### Security Features
- HTTPS/TLS in production
- CSRF protection with double-submit cookies
- SQL injection prevention via parameterized queries
- XSS protection via Content Security Policy headers
- Rate limiting on authentication endpoints
- Secure password hashing with bcrypt
- JWT token expiration and refresh rotation
- CORS configuration for frontend origin only

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Find and kill process using port 80
lsof -i :80
kill -9 <PID>
```

**Database connection errors**
```bash
# Check database is running
docker compose ps db

# View database logs
docker compose logs db
```

**Frontend not connecting to API**
- Verify `NEXT_PUBLIC_API_URL` is set to `/api/v1`
- Check nginx proxy is running: `docker compose ps nginx`
- Verify CORS origins in backend `.env`

**CSRF token errors**
- Ensure cookies are enabled in browser
- Check that `X-CSRF-Token` header is being sent
- Verify cookie domain matches request domain

### Getting Help

- Check logs: `docker compose logs -f <service>`
- Review API docs: http://localhost/docs
- Check backend README: [backend/README.md](./backend/README.md)
- Check frontend README: [frontend/README.md](./frontend/README.md)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

### Code Standards

- **Backend**: Follow PEP 8, use type hints, write tests
- **Frontend**: Use TypeScript, follow ESLint rules, write tests
- **Commits**: Use conventional commit messages
- **Documentation**: Update docs for API changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation at http://localhost/docs

---

**Last Updated**: October 2025
**Version**: 1.0.0
