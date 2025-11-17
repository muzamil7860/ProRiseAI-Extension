# ProRise AI Dashboard

A comprehensive Next.js application with MySQL database for managing user authentication, subscription plans, purchases, and usage statistics for the ProRise AI LinkedIn Assistant.

## Features

- 🔐 **User Authentication** - Register, login with JWT tokens
- 💳 **Plan Management** - View and purchase subscription plans
- 📊 **Usage Dashboard** - Track posts, comments, replies, and rewrites
- 💰 **Purchase History** - View all past transactions
- 🎨 **ProRise AI Branding** - Matching popup extension design (#7dde4f green, Satoshi font)

## Tech Stack

- **Framework**: Next.js 14 (TypeScript)
- **Database**: MySQL with Prisma ORM
- **Styling**: Tailwind CSS + Custom CSS
- **Authentication**: JWT (jsonwebtoken + bcrypt)
- **Font**: Satoshi from Fontshare

## Project Structure

```
prorise-dashboard/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data for plans
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── auth.ts            # Auth utilities
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register.ts    # User registration
│   │   │   │   └── login.ts       # User login
│   │   │   ├── plans/
│   │   │   │   └── index.ts       # Get all plans
│   │   │   ├── purchase/
│   │   │   │   └── index.ts       # Purchase plan
│   │   │   ├── stats/
│   │   │   │   └── index.ts       # User stats
│   │   │   └── dashboard/
│   │   │       └── index.ts       # Dashboard data
│   │   ├── index.tsx          # Landing page
│   │   ├── register.tsx       # Registration page
│   │   ├── login.tsx          # Login page
│   │   ├── dashboard.tsx      # User dashboard
│   │   ├── plans.tsx          # Plans page
│   │   ├── _app.tsx           # App wrapper
│   │   └── _document.tsx      # Document wrapper
│   └── styles/
│       └── globals.css        # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Setup Instructions

### 1. Install Dependencies

```powershell
cd prorise-dashboard
npm install
```

### 2. Configure Database

Create a `.env` file in the root directory:

```env
DATABASE_URL="mysql://user:password@localhost:3306/prorise_dashboard"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-here"
```

Replace with your actual MySQL credentials:
- `user` - your MySQL username
- `password` - your MySQL password
- `prorise_dashboard` - your database name

Generate secrets:
```powershell
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Create Database

```powershell
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE prorise_dashboard"
```

### 4. Run Migrations

```powershell
npm run prisma:generate
npm run prisma:migrate
```

This will create all tables: User, Plan, Purchase, UserStats

### 5. Seed Database

```powershell
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
```

This will create three default plans:
- **Free** ($0) - Basic features
- **Pro** ($29.99) - Unlimited features
- **Enterprise** ($99.99) - Team features

### 6. Run Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Plans

- `GET /api/plans` - Get all active plans

### Purchase

- `POST /api/purchase` - Purchase a plan (requires auth token)

### Stats

- `GET /api/stats` - Get user stats (requires auth token)
- `POST /api/stats` - Update user stats (requires auth token)

### Dashboard

- `GET /api/dashboard` - Get user dashboard data (requires auth token)

## Database Schema

### User
- `id`, `email`, `name`, `password`, `role`, `planId`, `createdAt`, `updatedAt`

### Plan
- `id`, `name`, `description`, `price`, `features` (JSON), `isActive`, `createdAt`, `updatedAt`

### Purchase
- `id`, `userId`, `planId`, `amount`, `status`, `paymentMethod`, `transactionId`, `purchaseDate`, `expiryDate`, `createdAt`, `updatedAt`

### UserStats
- `id`, `userId`, `postsCreated`, `commentsEnhanced`, `repliesSuggested`, `textsRewritten`, `totalUsage`, `lastUsedAt`, `createdAt`, `updatedAt`

## Scripts

```powershell
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio (database GUI)
```

## Usage Flow

1. **Register** - Create a new account at `/register`
2. **Login** - Login at `/login`
3. **Dashboard** - View stats and current plan at `/dashboard`
4. **Plans** - Browse and purchase plans at `/plans`
5. **Purchase** - Buy a plan (simulated payment)
6. **Stats** - Usage stats update automatically

## Branding

The dashboard matches the ProRise AI Chrome extension popup:
- **Primary Color**: #7dde4f (lime green)
- **Font**: Satoshi (from Fontshare)
- **Background**: Dark gradient (#0f0f0f to #000000)
- **Accents**: Green gradients and glows

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```powershell
npm run build
npm run start
```

Ensure your MySQL database is accessible from production environment.

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL format in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Migration Errors
```powershell
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### Port Already in Use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## License

© 2024 ProRise AI. All rights reserved.
