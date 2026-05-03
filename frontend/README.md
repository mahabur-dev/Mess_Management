# Mess Management Platform - Frontend

A modern, fully-responsive mess (shared kitchen) management platform built with Next.js, TypeScript, and Tailwind CSS. Perfect for managing shared living spaces with meal planning, finance tracking, shopping lists, and attendance management.

## 🚀 Features

### Core Features
- **User Authentication**: Custom JWT-based authentication with NestJS backend
- **Role-Based Access**: User, Manager, and Admin roles with different permissions
- **Dashboard**: Comprehensive dashboard with role-based content visibility
- **Meal Management**: Weekly meal planning and tracking
- **Finance Tracking**: Income/expense tracking with detailed reports
- **Shopping Lists**: Collaborative shopping with item assignment
- **Attendance Tracking**: Daily attendance records with analytics
- **Settings**: User profile, security, and notification preferences

### Design & UX
- **Deep Navy & Violet Theme**: Professional color scheme (#0F172A, #7C3AED, #A78BFA)
- **Fully Responsive**: Mobile-first design works on all devices
- **Smooth Animations**: Modern transitions and interactions
- **Accessibility**: WCAG 2.1 AA compliant
- **Dark Mode Ready**: Support for light and dark themes

### Technical Features
- **Next.js 15**: Latest App Router with React 19 support
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible components
- **SWR**: Data fetching and caching
- **PWA Ready**: Installable web app support
- **SEO Optimized**: Built-in metadata and Open Graph tags

## 📋 Requirements

- Node.js 18+ or higher
- npm, yarn, pnpm, or bun
- NestJS backend API (see API endpoints below)
- PostgreSQL database (managed by NestJS backend)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mess-management-frontend.git
cd mess-management-frontend
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
├── app/
│   ├── (auth)/                    # Auth pages (login, register)
│   ├── dashboard/                 # Main dashboard
│   │   ├── page.tsx              # Dashboard home
│   │   ├── meals/                # Meal management
│   │   ├── finance/              # Finance tracking
│   │   ├── shopping/             # Shopping lists
│   │   ├── attendance/           # Attendance tracking
│   │   └── settings/             # User settings
│   ├── api/                      # API routes
│   ├── context/                  # React contexts
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── dashboard-sidebar.tsx     # Sidebar navigation
│   ├── dashboard-header.tsx      # Dashboard header
│   ├── navbar.tsx                # Home navbar
│   ├── carousel-section.tsx      # Image carousel
│   ├── footer.tsx                # Footer
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── api-client.ts             # API client
│   └── utils.ts                  # Utilities
├── hooks/
│   ├── use-responsive.ts         # Responsive design hook
│   └── use-mobile.tsx            # Mobile detection
├── public/                       # Static assets
├── SETUP.md                      # Setup guide
├── DEPLOYMENT.md                 # Deployment guide
└── package.json
```

## 🎨 Color Scheme

The platform uses a carefully chosen "Deep Navy & Violet" theme:

- **Primary**: Deep Navy (#0F172A)
- **Secondary**: Violet (#7C3AED)
- **Accent**: Light Purple (#A78BFA)
- **Lightest**: Lavender (#E9D5FF)
- **Neutral**: Grays and Off-whites

Customize in `/app/globals.css` and `/tailwind.config.ts`

## 🔑 Key Pages

### Public Pages
- **Home** (`/`) - Landing page with features and CTAs
- **Login** (`/login`) - User login
- **Register** (`/register`) - New user registration

### Authenticated Pages
- **Dashboard** (`/dashboard`) - Main dashboard with overview
- **Meals** (`/dashboard/meals`) - Weekly meal planning
- **Finance** (`/dashboard/finance`) - Expense and income tracking
- **Shopping** (`/dashboard/shopping`) - Shopping list management
- **Attendance** (`/dashboard/attendance`) - Attendance records
- **Settings** (`/dashboard/settings`) - User preferences

## 📡 API Integration

The frontend communicates with a NestJS backend. Expected endpoints:

### Authentication
```
POST /api/auth/login           - Login user
POST /api/auth/register        - Register new user
```

### Messes
```
GET /api/messes                - Get all messes
POST /api/messes               - Create mess
```

### Meals
```
GET /api/meals                 - Get all meals
POST /api/meals                - Create meal
```

### Finance
```
GET /api/finance               - Get finance data
POST /api/finance              - Add transaction
```

### Shopping
```
GET /api/shopping              - Get shopping items
POST /api/shopping             - Add shopping item
```

### Attendance
```
GET /api/attendance            - Get attendance records
POST /api/attendance           - Mark attendance
```

### Users
```
GET /api/users                 - Get all users
```

## 🚀 Deployment

### Quick Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### Docker Deployment

```bash
docker build -t mess-management .
docker run -p 3000:3000 mess-management
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides for:
- Vercel
- Docker & Docker Compose
- AWS (Amplify, EC2, Cloud Run)
- Google Cloud Platform
- Netlify
- Heroku
- DigitalOcean

## 🔐 Security Features

- JWT-based authentication
- Secure password hashing (bcrypt on backend)
- CORS configured
- XSS protection
- CSRF tokens for form submissions
- Secure HTTP-only cookies
- Environment variable management
- Rate limiting support

## 📱 Mobile & PWA

- **Mobile-First Design**: Optimized for all screen sizes
- **Responsive Navigation**: Hamburger menu on mobile
- **Touch-Friendly**: Large tap targets (minimum 48x48px)
- **PWA Support**: Installable as native app
- **Offline Ready**: Manifest and service worker configured
- **App Shortcuts**: Quick access to key features

To install as an app:
1. Open in mobile browser
2. Tap "Share" → "Add to Home Screen"
3. Or use browser install prompt

## 🧪 Testing

```bash
# Run tests (if configured)
npm run test

# Build for production
npm run build

# Check for type errors
npm run type-check

# Lint code
npm run lint
```

## 📊 Performance Optimizations

- Image optimization with Next.js Image
- Automatic code splitting
- Tree shaking
- CSS-in-JS minification
- Gzip compression
- Caching strategies
- SEO metadata
- Web vitals tracking

## 🛠️ Development Tools

- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Component library
- **SWR**: Data fetching
- **Recharts**: Data visualization
- **Lucide Icons**: Beautiful icons

## 🐛 Troubleshooting

### Port 3000 in use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### API connection issues
1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. Ensure NestJS backend is running
3. Verify CORS configuration
4. Check browser console for errors

### Build errors
```bash
# Clear and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup and configuration
- [Deployment Guide](./DEPLOYMENT.md) - Deployment to various platforms
- [API Client](./lib/api-client.ts) - API client documentation

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

## 🙋 Support

For issues and questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Review documentation in SETUP.md and DEPLOYMENT.md

## 🎯 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Budget forecasting
- [ ] Recipe management
- [ ] Meal preferences and dietary restrictions
- [ ] Automated notifications
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration features
- [ ] Integration with payment systems
- [ ] Member ratings and feedback

## 👥 Team

Built with care for mess management communities everywhere.

---

**Ready to simplify your mess management?** Start today! 🚀
