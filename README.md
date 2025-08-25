# appointement_booking_app

this is govermental apointment booking app for every one who interst to visit govermental offfices

## 🚀 Features

### Core Framework

- **FastAPI** with async/await patterns
- **SQLAlchemy Core** for database operations
- **Alembic** for database migrations
- **Pydantic** for data validation

- **PostgreSQL** with connection pooling

### Security & Authentication

- **JWT-based authentication** with access and refresh tokens
- **Argon2 password hashing**

- **Undeletable system admin** user for recovery

- **Role-Based Access Control (RBAC)** system

- **Enhanced password validation** (8+ chars, uppercase, lowercase, digit, special)

- **Email domain restrictions** (only gmail.com,amoud.org allowed)

- **Security headers** middleware
- **Request size limiting** and timeout protection

### Middleware Stack

- **Rate limiting** with Redis backend

- **Response caching** with Redis

- **CORS configuration**

- **Error handling** with standardized responses
- **Security headers** (HSTS, CSP, etc.)

### Monitoring & Health Checks

- **Comprehensive health checks** (database, Redis, system)
- **Application metrics** collection

- **Kubernetes-ready probes** (liveness, readiness, startup)

### Caching System

- **Redis-based caching** with async support
- **Response caching** middleware
- **Cache decorators** for functions
- **Cache invalidation** patterns

### Admin & User Management

- **User CRUD operations** with proper authorization
- **Role and permission management**
- **User profile management**
- **Account activation/deactivation**

## 📁 Project Structure

```
appointement_booking_app/
├── backend/app/
│   ├── api/v1/           # API endpoints
│   ├── auth/             # Authentication system
│   ├── core/             # Core components & middleware

│   ├── admin/            # Admin panel endpoints

│   ├── models/           # Database models
│   ├── config.py         # Application configuration
│   ├── database.py       # Database connection
│   └── main.py           # FastAPI application


├── nginx/                # Nginx configuration

├── compose.yaml          # Docker Compose configuration

└── scripts/              # Deployment & utility scripts
```

## 🚦 Getting Started

### 1. **Environment Setup**

```bash
cd appointement_booking_app
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

### 2. **Install Dependencies**

```bash
cd backend

# Using uv (recommended)
uv sync --group dev

```

### 3. **Database Setup**

```bash
# Run database migrations
alembic upgrade head


# Initialize RBAC system (creates system admin)
python scripts/init_rbac.py

```

### 5. **Development Server**

```bash
# Start development server
fastapi dev app/main.py

# Access API documentation
open http://localhost:8000/docs
```

### 6. **Production Deployment**

```bash
# Full production deployment
./scripts/deploy.sh


# Deploy with 3 app instances
./scripts/deploy.sh --scale 3


# Build only (no deployment)
./scripts/deploy.sh --build-only
```

## 🔐 Authentication & Authorization

### Default Credentials

After running `python scripts/init_rbac.py`:

- **System Admin**: `system.admin@internal.local` (undeletable)
- **Regular Admin**: `admin@example.com` (manageable)
- **⚠️ IMPORTANT**: Change passwords immediately!

### User Registration

```bash
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@gmail.com",
    "password": "SecurePass123!"
  }'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/v1/users/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john@gmail.com&password=SecurePass123!"
```

## 🔧 Configuration

### Key Environment Variables

```bash
# Project
PROJECT_NAME=appointement_booking_app
ENVIRONMENT=local

# Security
SECRET_KEY=your-secret-key


# Database

POSTGRES_SERVER=localhost
POSTGRES_USER=appointement_booking_app
POSTGRES_PASSWORD=your-password
POSTGRES_DB=appointement_app



# Redis
REDIS_HOST=localhost
REDIS_PORT=6379



# Email Restrictions
ALLOWED_EMAIL_DOMAINS=gmail.com,amoud.org
ENFORCE_EMAIL_DOMAIN=true

```

## 🌐 Service URLs

After deployment:

- **API**: http://localhost/
- **API Docs**: http://localhost/docs (dev only)
- **Health Check**: http://localhost/api/v1/health/

- **Database Admin**: http://localhost:8080 (Adminer)

- **Email Testing**: http://localhost:8025 (Mailpit)

## 🧪 Validation Rules

### Password Requirements

- ✅ **Minimum 8 characters** long
- ✅ **At least 1 uppercase** letter (A-Z)
- ✅ **At least 1 lowercase** letter (a-z)
- ✅ **At least 1 digit** (0-9)
- ✅ **At least 1 special character** (!@#$%^&\*()\_+-=[]{}|;:,.<>?)

### Email Requirements

- ✅ **Only gmail.com,amoud.org domains** allowed
- ✅ **Case insensitive** validation

## 📊 API Endpoints

### Core Endpoints

- `GET /` - Root endpoint
- `GET /api/v1/health/` - Basic health check
- `POST /api/v1/users/` - User registration
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/me` - Current user profile

### Validation Endpoints

- `GET /api/v1/validation/password-requirements` - Password rules
- `GET /api/v1/validation/email-requirements` - Email rules
- `POST /api/v1/validation/check-password-strength` - Password strength check

### Admin Endpoints (Protected)

- `GET /api/v1/admin/users` - List all users
- `DELETE /api/v1/admin/users/{id}` - Delete user (system users protected)
- `GET /api/v1/admin/system/info` - System information

## 🛠️ Development

### Adding New Endpoints

```python
from app.auth.dependencies import require_permissions

@router.get("/my-endpoint")
async def my_endpoint(
    current_user: CurrentUser = Depends(require_permissions("resource:action"))
):
    return {"message": "Authorized access"}
```

### Custom Caching

```python
from app.core.cache import cache

@cache("my_data", ttl=300)
async def expensive_operation():
    return result
```

## 🚀 Production Checklist

- ✅ Change default passwords in .env
- ✅ Set strong SECRET_KEY

- ✅ Configure proper CORS origins

- ✅ Set up SSL certificates
- ✅ Configure backup automation

- ✅ Review security headers
- ✅ Test disaster recovery

## 📚 Documentation

- [Validation Guide](VALIDATION_GUIDE.md) - Password & email validation

- [System Admin Guide](SYSTEM_ADMIN_GUIDE.md) - Undeletable admin user

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Generated from FastAPI Production Boilerplate** 🚀
Built with ❤️ by zygo tech
