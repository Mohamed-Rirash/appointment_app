# 🎨 MocaadApp Frontend

A modern Next.js 16 frontend for the Appointment Booking System with React 19, TailwindCSS 4, and TypeScript.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Components](#components)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Testing](#testing)

---

## 🌟 Overview

The frontend provides a responsive, role-based dashboard for managing appointments, users, and offices.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Role-Based UI** | Different views for Admin, Host, and Reception |
| 📅 **Appointment Dashboard** | Create, view, and manage appointments |
| 👥 **User Management** | Admin panel for user CRUD operations |
| 🏢 **Office Management** | Configure offices and locations |
| 📱 **Responsive Design** | Mobile-first, works on all devices |
| 🌙 **Dark Mode** | System-aware theme switching |
| 🔄 **Real-time Updates** | React Query for server state |
| ✅ **Form Validation** | Zod schemas with React Hook Form |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **TailwindCSS 4** | Utility-first styling |
| **Zustand** | Client state management |
| **React Query** | Server state & caching |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Radix UI** | Accessible components |
| **Lucide Icons** | Icon library |
| **Iron Session** | Session management |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **pnpm** (recommended) or npm

### Using Docker (Recommended)

```bash
# From project root
docker compose up -d

# View logs
docker compose logs -f frontend
```

### Local Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Access at: **http://localhost:5173**

---

## 📁 Project Structure

```
frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth pages (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/           # Protected dashboard pages
│   │   ├── admin/             # Admin-only pages
│   │   │   ├── users/
│   │   │   └── offices/
│   │   ├── host/              # Host pages
│   │   │   └── appointments/
│   │   ├── reception/         # Reception pages
│   │   │   └── check-in/
│   │   └── profile/           # User profile
│   ├── api/                   # API routes (session handling)
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
│
├── components/                 # Reusable components
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── forms/                 # Form components
│   ├── tables/                # Data tables
│   └── layout/                # Layout components
│
├── helpers/                    # Utilities & hooks
│   ├── hooks/                 # Custom React hooks
│   ├── api/                   # API client functions
│   ├── stores/                # Zustand stores
│   └── utils/                 # Utility functions
│
├── lib/                       # Library configurations
│   └── session.ts             # Iron Session config
│
├── public/                    # Static assets
├── styles/                    # Global styles
├── types/                     # TypeScript types
├── Dockerfile                 # Container image
├── package.json               # Dependencies
└── tailwind.config.ts         # Tailwind configuration
```

---

## 💻 Development

### Available Scripts

```bash
# Development server with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format
```

### Environment Variables

Create `.env.local` for local development:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Session secret (32+ characters)
SESSION_SECRET=your-secret-key-at-least-32-characters

# Environment
NODE_ENV=development
```

---

## 🧩 Components

### UI Components (Radix UI Based)

Located in `components/ui/`:

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, outline variants |
| `Input` | Text input with validation states |
| `Dialog` | Modal dialogs |
| `Select` | Dropdown selection |
| `Table` | Data tables with sorting |
| `Card` | Content containers |
| `Badge` | Status indicators |
| `Toast` | Notifications |

### Usage Example

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MyForm() {
  return (
    <form>
      <Input placeholder="Enter email" type="email" />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## 📦 State Management

### Zustand Stores

Located in `helpers/stores/`:

```tsx
// Example: Auth Store
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### React Query for Server State

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch appointments
const { data, isLoading } = useQuery({
  queryKey: ['appointments'],
  queryFn: fetchAppointments,
});

// Create appointment
const mutation = useMutation({
  mutationFn: createAppointment,
  onSuccess: () => {
    queryClient.invalidateQueries(['appointments']);
  },
});
```

---

## 🔌 API Integration

### API Client

Located in `helpers/api/`:

```tsx
// helpers/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('API Error');
  }

  return response.json();
}
```

### API Functions

```tsx
// helpers/api/appointments.ts
export const appointmentsApi = {
  getAll: () => apiClient<Appointment[]>('/appointments'),
  getById: (id: string) => apiClient<Appointment>(`/appointments/${id}`),
  create: (data: CreateAppointment) =>
    apiClient<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

---

## 🎨 Styling

### TailwindCSS 4

Configuration in `tailwind.config.ts`:

```ts
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ },
      },
    },
  },
  plugins: [],
};
```

### CSS Variables

```css
/* styles/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Writing Tests

```tsx
// __tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## 👥 User Roles & Pages

| Role | Pages | Description |
|------|-------|-------------|
| **Admin** | `/admin/*` | User management, office management, system settings |
| **Host** | `/host/*` | View appointments, manage availability |
| **Reception** | `/reception/*` | Check-in visitors, manage walk-ins |
| **All** | `/profile` | User profile settings |

---

## 🔒 Authentication Flow

1. User submits login form
2. Frontend calls `/api/auth/login` (Next.js API route)
3. API route calls backend `/api/v1/users/login`
4. Backend returns JWT tokens
5. API route stores tokens in Iron Session
6. Frontend redirects to dashboard

```
┌─────────┐     ┌──────────────┐     ┌─────────┐
│ Browser │────►│ Next.js API  │────►│ Backend │
│         │◄────│   Route      │◄────│   API   │
└─────────┘     └──────────────┘     └─────────┘
                      │
                      ▼
               ┌──────────────┐
               │ Iron Session │
               │   (Cookie)   │
               └──────────────┘
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [React Query Documentation](https://tanstack.com/query)
- [Radix UI Documentation](https://www.radix-ui.com)

---

## 🤝 Contributing

1. Follow the component structure
2. Use TypeScript for all files
3. Add proper types and interfaces
4. Write tests for new components
5. Follow TailwindCSS conventions

---

**Last Updated**: December 2025
**Version**: 1.0.0
