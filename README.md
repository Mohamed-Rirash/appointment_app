# 🏢 Office Appointment Management System

A comprehensive, production-ready FastAPI application for managing office appointments, host scheduling, and user access control. Built with modern Python technologies and enterprise-grade features for scalability and reliability.

## 🌟 Overview

This application provides a complete solution for managing office-based appointment systems with sophisticated user management, host scheduling, and comprehensive administrative controls. It features multi-office support, role-based access control, real-time availability management, and integrated notification systems.

## 🛠️ Tech Stack

### Backend Framework
- **Python 3.12** - Modern Python runtime
- **FastAPI** - High-performance async web framework
- **SQLAlchemy 2.x** - Async ORM with PostgreSQL support
- **Pydantic v2** - Data validation and serialization

### Database & Caching
- **PostgreSQL** - Primary database with async support (`asyncpg`)
- **Redis** - Caching, rate limiting, and session storage
- **Alembic** - Database migration management

### External Integrations
- **SMTP Email** - Email notifications (configurable provider)
- **SMS Service** - SMS notifications (configurable provider)
- **Docker** - Complete containerized deployment

### Development & Testing
- **Pytest** - Comprehensive test suite
- **Docker Compose** - Local development environment
- **Uvicorn** - ASGI server with auto-reload

## 🎯 Core Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** - Secure token-based user sessions
- **Role-Based Access Control (RBAC)** - Granular permission system
- **Multi-level User Roles** - Admin, Host, Secretary, Reception, User roles
- **Email Domain Restrictions** - Configurable access control

### 🏢 Office Management
- **Multi-Office Support** - Manage multiple office locations
- **Office Membership System** - User-office relationship management
- **Host Assignment** - Assign users as appointment hosts
- **Office Statistics** - Comprehensive reporting and analytics

### 📅 Appointment System
- **Time Slot Management** - Automated slot generation from host availability
- **Appointment Booking** - Citizen appointment scheduling
- **Status Tracking** - Complete appointment lifecycle management
- **Conflict Prevention** - Automated double-booking prevention

### ⏰ Host Availability
- **Recurring Schedules** - Weekly availability patterns
- **One-time Availability** - Special date availability
- **15-minute Slots** - Automated time slot generation
- **Real-time Updates** - Dynamic availability management

### 📧 Communication
- **Email Notifications** - Automated email alerts
- **SMS Notifications** - SMS-based alerts and reminders
- **Template System** - Customizable notification templates
- **Multi-provider Support** - Configurable SMS and email providers

### 🔧 Enterprise Features
- **Response Caching** - Redis-backed response caching
- **Rate Limiting** - Configurable request throttling
- **Security Headers** - Comprehensive security middleware
- **Request Logging** - Structured logging with correlation IDs
- **Health Monitoring** - Application health endpoints
- **CORS Support** - Cross-origin resource sharing

## 🏗️ Architecture

### Application Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI application factory
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection management
│   ├── auth/                # Authentication system
│   │   ├── models.py        # User and auth models
│   │   ├── router.py        # Authentication endpoints
│   │   └── dependencies.py  # Auth middleware
│   ├── appointments/        # Appointment management
│   │   ├── models.py        # Appointment database models
│   │   ├── routers.py       # Appointment API endpoints
│   │   ├── services.py      # Business logic
│   │   └── schemas.py       # Request/response schemas
│   ├── office_mgnt/         # Office management system
│   │   ├── models.py        # Office and membership models
│   │   ├── router.py        # Office management endpoints
│   │   ├── services.py      # Office business logic
│   │   └── schemas.py       # Office data schemas
│   ├── admin/               # Administrative functions
│   ├── core/                # Core middleware and utilities
│   │   ├── cache.py         # Redis caching system
│   │   ├── middleware/      # Security and performance middleware
│   │   └── exceptions.py    # Custom exception handlers
│   ├── notifications/       # SMS and email notifications
│   ├── emails/              # Email service
│   ├── sms/                 # SMS service
│   └── templates/           # Email templates
├── tests/                   # Test suite
├── alembic/                 # Database migrations
└── compose.yml              # Docker orchestration
```

### Database Schema
```sql
-- Core entities
users (id, email, roles, permissions)
offices (id, name, location, status)
office_memberships (user_id, office_id, position, is_primary)

-- Appointment system
appointments (id, citizen_id, host_id, office_id, appointment_date, status)
time_slots (id, office_id, slot_start, slot_end, date, is_booked)

-- Availability management
host_availability (id, office_id, daysofweek, start_time, end_time, is_recurring)
```

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Python 3.12+** (for local development)

### Docker Deployment (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd appointment-app
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application:**
   ```bash
   docker compose up --build
   ```

4. **Access the application:**
   - **API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs (development only)
   - **Database Admin**: http://localhost:8080 (Adminer)
   - **Email Testing**: http://localhost:8025 (Mailpit)

### Local Development Setup

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -e .
   ```

3. **Configure environment variables in `.env`:**
   ```env
   SECRET_KEY=your-secret-key-here
   ENVIRONMENT=local
   POSTGRES_SERVER=localhost
   POSTGRES_USER=appuser
   POSTGRES_PASSWORD=your-password
   POSTGRES_DB=appointment_app
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Initialize database:**
   ```bash
   alembic upgrade head
   ```

5. **Start the application:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## 🔧 Configuration

### Environment Variables

#### Core Application
```env
SECRET_KEY=your-secret-key-min-32-chars
ENVIRONMENT=local|development|staging|production
API_V1_STR=/api/v1
FRONTEND_HOST=http://localhost:3000
```

#### Database
```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=appuser
POSTGRES_PASSWORD=your-password
POSTGRES_DB=appointment_app
```

#### Redis (Caching & Rate Limiting)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
CACHE_TTL=300
```

#### Email Configuration
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@yourdomain.com
```

#### SMS Configuration
```env
SMS_ENABLED=true
SMS_PROVIDER=twilio|smscatcher
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-secret
```

#### Security & Performance
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
CORS_ORIGINS=["http://localhost:3000"]
ALLOWED_HOSTS=["localhost", "127.0.0.1"]
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Current user profile

### Office Management
- `GET /api/v1/offices` - List all offices
- `POST /api/v1/offices` - Create new office
- `GET /api/v1/offices/{office_id}` - Get office details
- `PATCH /api/v1/offices/{office_id}` - Update office
- `DELETE /api/v1/offices/{office_id}` - Delete office

### Membership Management
- `POST /api/v1/offices/{office_id}/memberships` - Assign user to office
- `GET /api/v1/offices/{office_id}/memberships` - List office members
- `PATCH /api/v1/offices/{office_id}/memberships/{user_id}` - Update membership
- `DELETE /api/v1/offices/{office_id}/memberships/{user_id}` - Remove membership

### Host Management
- `POST /api/v1/offices/hosts/assign` - Assign host to office
- `GET /api/v1/offices/hosts` - List host assignments
- `PUT /api/v1/offices/hosts/{host_id}/office/{office_id}` - Update host assignment
- `DELETE /api/v1/offices/hosts/{host_id}/office/{office_id}` - Remove host

### Availability Management
- `POST /api/v1/availability/hosts/{office_id}` - Set host availability
- `GET /api/v1/availability/hosts/{office_id}` - Get host availability
- `GET /api/v1/availability/hosts/{office_id}/slots` - Get available time slots

### Appointment Management
- `GET /api/v1/appointments` - List appointments
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments/{appointment_id}` - Get appointment details
- `PATCH /api/v1/appointments/{appointment_id}` - Update appointment
- `DELETE /api/v1/appointments/{appointment_id}` - Cancel appointment

## 🔐 Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Password hashing with bcrypt
- Email verification system
- Account lockout protection

### Access Control
- Role-based permissions (RBAC)
- Office-level access control
- API endpoint protection
- Admin-only operations

### Security Middleware
- CORS configuration
- Security headers
- Request size limits
- Rate limiting per endpoint
- SQL injection prevention

## 📊 Monitoring & Logging

### Health Checks
- Application health endpoint (`/health`)
- Database connectivity monitoring
- Redis connectivity monitoring
- Service dependency checks

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking and reporting
- Performance metrics

### Metrics Collection
- Response time tracking
- Error rate monitoring
- Cache hit/miss ratios
- Database query performance

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test module
pytest tests/test_appointments.py

# Run with verbose output
pytest -v
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- Database operation tests
- Authentication flow tests

## 🚀 Deployment

### Production Considerations

#### Environment Setup
```env
ENVIRONMENT=production
SECRET_KEY=your-production-secret-key
POSTGRES_SERVER=your-prod-db-host
REDIS_HOST=your-redis-host
ALLOWED_HOSTS=["yourdomain.com", "www.yourdomain.com"]
```

#### Security Enhancements
- Enable HTTPS/SSL
- Configure proper CORS origins
- Set up monitoring and alerting
- Implement backup strategies
- Configure log aggregation

#### Performance Optimization
- Enable response caching
- Configure appropriate rate limits
- Set up database connection pooling
- Implement background job processing

### Docker Production Deployment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: your-registry/appointment-app:latest
    environment:
      - ENVIRONMENT=production
    deploy:
      replicas: 3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`pytest`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guidelines
- Write comprehensive docstrings
- Add type hints to all functions
- Include tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@yourdomain.com
- 💬 Slack: [#appointment-app](https://your-slack-workspace.slack.com)
- 📖 Documentation: [Internal Wiki](https://wiki.yourdomain.com)

---

**Built with ❤️ using FastAPI, Python, and modern web technologies.**