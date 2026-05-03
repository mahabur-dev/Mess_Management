# Quick Start Guide

Get your Mess Management Platform running in 5 minutes!

## 1. Install & Setup

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.local.example .env.local
```

## 2. Configure Backend URL

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 3. Start Development Server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

## 4. Test the App

### Default Test Account (Mock Authentication)
- **Email**: any@example.com
- **Password**: any password

The app uses mock authentication during development. Replace with real backend in `app/api/auth/login/route.ts` and `app/api/auth/register/route.ts`.

## 5. Explore the App

### Home Page (`/`)
- Landing page with features overview
- Call-to-action buttons for registration
- Feature cards and carousel examples

### Login (`/login`)
- Email and password input
- Link to registration page

### Register (`/register`)
- Full name, email, and password fields
- Password confirmation
- Link to login page

### Dashboard (`/dashboard`)
- Overview with stats cards
- Charts showing growth trends
- Role-based quick action cards

### Dashboard Sections
1. **Meals** (`/dashboard/meals`) - Weekly menu planning
2. **Finance** (`/dashboard/finance`) - Expense tracking
3. **Shopping** (`/dashboard/shopping`) - Shopping lists
4. **Attendance** (`/dashboard/attendance`) - Attendance records
5. **Settings** (`/dashboard/settings`) - User preferences

## Key Features to Test

### 1. Responsive Design
- Resize browser to see mobile layout
- Sidebar becomes hamburger menu on mobile
- All components adapt to screen size

### 2. Navigation
- Click sidebar items to navigate
- Mobile menu opens/closes properly
- Breadcrumbs help track location

### 3. Forms
- Login and register pages have form validation
- Shopping list allows adding/removing items
- Settings page has editable fields

### 4. Charts & Data
- Dashboard shows bar and line charts
- Finance page has pie chart
- All charts are interactive

### 5. Dark Mode Ready
- Theme system supports dark mode
- Colors defined in CSS variables
- Easy to toggle dark theme

## Project Structure

```
app/
├── page.tsx                    # Home page
├── (auth)/
│   ├── login/page.tsx         # Login page
│   └── register/page.tsx       # Register page
├── dashboard/
│   ├── page.tsx               # Dashboard home
│   ├── meals/page.tsx         # Meals
│   ├── finance/page.tsx       # Finance
│   ├── shopping/page.tsx      # Shopping
│   ├── attendance/page.tsx    # Attendance
│   └── settings/page.tsx      # Settings
├── api/
│   └── auth/
│       ├── login/route.ts     # Mock login
│       └── register/route.ts  # Mock register
└── context/
    └── auth-context.tsx       # Auth state management

components/
├── dashboard-sidebar.tsx       # Sidebar
├── dashboard-header.tsx        # Header
├── navbar.tsx                  # Navbar
├── carousel-section.tsx        # Carousel
├── footer.tsx                  # Footer
└── ui/                         # shadcn/ui components

lib/
├── api-client.ts              # API client
└── utils.ts                   # Utilities
```

## Common Tasks

### Change Colors
Edit `/app/globals.css`:
```css
:root {
  --primary: #0F172A;      /* Deep Navy */
  --secondary: #7C3AED;    /* Violet */
  --accent: #A78BFA;       /* Light Purple */
}
```

### Modify Theme
Update `/tailwind.config.ts` for custom Tailwind utilities.

### Update Navigation
Edit `components/dashboard-sidebar.tsx` for sidebar items.

### Add New Route
1. Create folder in `app/dashboard/`
2. Add `page.tsx` file
3. Update sidebar items
4. Use DashboardHeader component

### Connect to Real Backend

Replace mock API routes:

1. **Login** - Edit `app/api/auth/login/route.ts`
2. **Register** - Edit `app/api/auth/register/route.ts`

Or modify `app/context/auth-context.tsx` to call your API directly.

## Debugging

### View Logs
```bash
# Terminal shows build and runtime logs
# Browser DevTools (F12) shows console logs
```

### Check Environment
```bash
# Verify API URL is set
echo $NEXT_PUBLIC_API_URL
```

### Test API Calls
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

## Next Steps

1. **Connect Backend**: Implement real NestJS API endpoints
2. **Database**: Setup PostgreSQL with Prisma ORM
3. **Authentication**: Implement JWT tokens properly
4. **Real Data**: Replace mock data with API responses
5. **Styling**: Customize colors and fonts to match brand
6. **Testing**: Add unit and integration tests
7. **Deployment**: Deploy to Vercel, Docker, or your hosting

## Tips & Tricks

- Use `pnpm dev` for hot reload during development
- `pnpm build` checks for TypeScript errors before building
- Console logs appear in terminal and browser DevTools
- Tailwind CSS has autocomplete in most editors
- shadcn/ui components are fully customizable

## File Upload & Assets

The `public/` directory contains static files:
- Place images in `public/images/`
- Place icons in `public/icons/`
- Reference with `/images/filename.png`

## Environment Variables

Available for configuration:
```env
# Required
NEXT_PUBLIC_API_URL=your-api-url

# Optional
DEBUG=mess-management:*
NODE_ENV=development
```

## Performance

- Next.js automatically optimizes images
- Code splitting happens automatically
- CSS is minified in production
- Use `next/Image` for images (already used)

## Mobile Testing

```bash
# Test on your phone
# Find your computer's IP
ipconfig getifaddr en0    # Mac
hostname -I               # Linux
ipconfig                  # Windows

# Access via http://{YOUR_IP}:3000
```

## Helpful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Need Help?

1. Check the SETUP.md for detailed setup information
2. Review DEPLOYMENT.md for deployment options
3. Check error messages in console (F12 in browser)
4. Look at similar components for patterns
5. Search GitHub issues for similar problems

---

Happy coding! Get started with `pnpm dev` now!
