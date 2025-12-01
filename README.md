# 🗓️ MocaadApp - Appointment Booking System

A full-stack appointment booking and visitor management system built with **FastAPI** and **Next.js**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![Next.js](https://img.shields.io/badge/next.js-16-black.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

---

## 📋 Overview

MocaadApp is a comprehensive appointment booking system that enables organizations to manage visitor appointments, check-ins, and office resources efficiently.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Role-Based Access** | Admin, Host, and Reception roles with specific permissions |
| 📅 **Appointment Management** | Create, schedule, reschedule, and cancel appointments |
| 🏢 **Office Management** | Manage multiple offices and locations |
| 👥 **Visitor Check-in** | QR code and walk-in check-in support |
| 📧 **Email Notifications** | Automated email confirmations and reminders |
| 📱 **SMS Notifications** | Optional SMS alerts for appointments |
| 📊 **Dashboard Analytics** | Real-time statistics and reporting |
| 🔒 **Secure Authentication** | JWT-based auth with password hashing |

---

## 🏗️ Tech Stack

### Backend
- ⚡ **FastAPI** - High-performance Python web framework
- 🗄️ **SQLAlchemy** + **SQLModel** - Database ORM
- 🐘 **PostgreSQL** - Database
- 🔐 **JWT** - Authentication
- 📧 **FastAPI-Mail** - Email notifications
- ✅ **Pytest** - Testing

### Frontend
- ⚛️ **Next.js 16** - React framework
- 🎨 **TailwindCSS 4** - Styling
- 📦 **Zustand** - State management
- 🔄 **React Query** - Server state
- 🧩 **Radix UI** - Components
- 📝 **React Hook Form** + **Zod** - Forms & validation

### Infrastructure
- 🐳 **Docker** - Containerization
- 🔀 **Traefik** - Reverse proxy with auto SSL
- 🔒 **Let's Encrypt** - SSL certificates

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd appointment_booking_app

# Start development environment
docker compose up -d

# View logs
docker compose logs -f
```

### Access Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### Default Credentials

- **Email**: `admin@example.com`
- **Password**: `changethis`

---

## 📁 Project Structure

```
appointment_booking_app/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── admin/          # Admin module
│   │   ├── appointments/   # Appointments module
│   │   ├── auth/           # Authentication module
│   │   ├── notifications/  # Email/SMS notifications
│   │   ├── office_mgnt/    # Office management
│   │   └── main.py         # Application entry
│   ├── tests/              # Backend tests
│   └── Dockerfile
├── frontend/               # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/        # Auth pages (login, register)
│   │   ├── (dashboard)/   # Dashboard pages
│   │   └── api/           # API routes
│   ├── components/        # UI components
│   ├── helpers/           # Utilities & hooks
│   └── Dockerfile
├── docker-compose.yml      # Development config
├── docker-compose.prod.yml # Production config
└── .env.production         # Production environment
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_SERVER=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app

# Security
SECRET_KEY=your-secret-key-here

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Admin User
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis
```

Generate secure keys with:
```bash
openssl rand -base64 32
```

---

## 🐳 Docker Commands

```bash
# Development
docker compose up -d                    # Start all services
docker compose down                     # Stop all services
docker compose logs -f                  # View logs
docker compose exec backend bash        # Shell into backend

# Production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production down
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, office management |
| **Host** | Manage own appointments, set availability |
| **Reception** | Check-in visitors, manage walk-ins |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Backend README](./backend/README.md) | Backend API documentation |
| [Frontend README](./frontend/README.md) | Frontend documentation |
| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | Production deployment |
| [Development Guide](./development.md) | Development setup |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html
```

---

## 🌐 Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://dashboard.mocaadapp.org |
| Backend API | https://api.mocaadapp.org |
| API Docs | https://api.mocaadapp.org/docs |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
