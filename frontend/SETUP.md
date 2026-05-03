# Mess Management Platform - Frontend Setup Guide

This is the Next.js frontend application for the Mess Management Platform. Follow these steps to set up and run the project.

## Prerequisites

- Node.js 18+ or higher
- npm, yarn, pnpm, or bun package manager
- A code editor (VS Code recommended)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mess-management-frontend
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
# or
bun install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your settings:

```
# NestJS Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Optional: Enable debug logging
DEBUG=mess-management:*
```

## Running the Application

### Development Mode

```bash
pnpm dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── (auth)/                 # Authentication routes (login, register)
│   ├── dashboard/              # Main dashboard and sub-sections
│   │   ├── meals/             # Meal planning section
│   │   ├── finance/           # Finance tracking section
│   │   ├── shopping/          # Shopping list section
│   │   ├── attendance/        # Attendance tracking section
│   │   └── settings/          # User settings section
│   ├── context/               # React context for auth state
│   ├── api/                   # API route handlers
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── dashboard-sidebar.tsx  # Dashboard sidebar navigation
│   ├── dashboard-header.tsx   # Dashboard header
│   ├── navbar.tsx             # Home page navbar
│   ├── carousel-section.tsx   # Image carousel component
│   ├── footer.tsx             # Footer component
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── api-client.ts          # API client for backend calls
│   └── utils.ts               # Utility functions
├── hooks/                      # Custom React hooks
└── public/                     # Static assets
```

## Key Features

### Authentication
- Login and Register pages with form validation
- JWT-based authentication (Custom JWT with NestJS backend)
- Auth context for state management
- Protected dashboard routes

### Dashboard
- **Role-Based Access**: User, Manager, and Admin roles with different views
- **Dashboard Home**: Overview with stats, charts, and quick actions
- **Meals**: Weekly menu planning and management
- **Finance**: Expense tracking, income management, and reports
- **Shopping**: Collaborative shopping lists with item tracking
- **Attendance**: Member attendance tracking and analytics
- **Settings**: Profile, security, and notification preferences

### Design
- Deep Navy & Violet color theme
- Fully responsive (mobile, tablet, desktop)
- Tailwind CSS for styling
- shadcn/ui components
- Smooth animations and transitions
- Dark mode support ready

### PWA Ready
- Manifest configuration for installable app
- Service worker support (can be added)
- Offline-ready structure

## API Integration

The frontend expects a NestJS backend with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Messes
- `GET /api/messes` - Get all messes
- `POST /api/messes` - Create new mess

### Meals
- `GET /api/meals` - Get all meals
- `POST /api/meals` - Create new meal

### Users
- `GET /api/users` - Get all users

### Finance
- `GET /api/finance` - Get finance data

### Shopping
- `GET /api/shopping` - Get shopping lists

### Attendance
- `GET /api/attendance` - Get attendance records

## API Client Usage

The `lib/api-client.ts` provides a ready-to-use API client:

```typescript
import { apiClient } from '@/lib/api-client'

// Example: Login
const result = await apiClient.login(email, password)

// Example: Get meals
const meals = await apiClient.getMeals()
```

## Customization

### Colors
Modify the color scheme in `/app/globals.css` and `/tailwind.config.ts`:
- Primary: Deep Navy (#0F172A)
- Secondary: Violet (#7C3AED)
- Accent: Light Purple (#A78BFA)

### Fonts
Update fonts in `/app/layout.tsx` using Google Fonts

### Components
All UI components from shadcn/ui are available in `/components/ui/`

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
Create a `Dockerfile` in the root:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t mess-management .
docker run -p 3000:3000 mess-management
```

## Troubleshooting

### Port 3000 already in use
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API Connection Issues
1. Ensure NestJS backend is running on `http://localhost:3000`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS settings on the backend
4. Check browser console for detailed error messages

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

## Development Tips

1. **Hot Reload**: Changes are automatically reflected in the browser
2. **TypeScript**: Full TypeScript support for type safety
3. **Console Logs**: Use `console.log("[v0] ...")` for debug statements
4. **API Testing**: Use the mock API endpoints during development
5. **Component Testing**: shadcn/ui components are fully tested

## Database Schema (Reference)

The NestJS backend should implement the following schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role ENUM('user', 'manager', 'admin'),
  password_hash VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Messes table
CREATE TABLE messes (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  manager_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Meals table
CREATE TABLE meals (
  id UUID PRIMARY KEY,
  mess_id UUID,
  date DATE,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Finance table
CREATE TABLE finance (
  id UUID PRIMARY KEY,
  mess_id UUID,
  amount DECIMAL,
  type ENUM('income', 'expense'),
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  mess_id UUID,
  user_id UUID,
  date DATE,
  status ENUM('present', 'absent'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Shopping table
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY,
  mess_id UUID,
  name VARCHAR(255),
  quantity INT,
  unit VARCHAR(50),
  completed BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Support & Contributions

For issues and feature requests, please open an issue on GitHub.

## License

MIT License - See LICENSE file for details

---

**Happy coding!** 🚀
