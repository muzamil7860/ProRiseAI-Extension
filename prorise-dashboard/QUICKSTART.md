# ProRise AI Dashboard - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- MySQL 8+ running locally
- PowerShell (Windows)

## Quick Setup (5 minutes)

### Step 1: Install Dependencies
```powershell
cd prorise-dashboard
npm install
```

### Step 2: Setup Database
```powershell
# Create database (enter MySQL password when prompted)
mysql -u root -p -e "CREATE DATABASE prorise_dashboard"
```

### Step 3: Configure Environment
Copy `.env.example` to `.env` and update with your MySQL credentials:

```powershell
cp .env.example .env
```

Edit `.env` and replace:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/prorise_dashboard"
```

Generate secrets:
```powershell
# Run this to get NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Run this to get JWT_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add these to your `.env` file.

### Step 4: Initialize Database
```powershell
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# Seed database with plans
npm run prisma:seed
```

### Step 5: Start Development Server
```powershell
npm run dev
```

Open http://localhost:3000 🚀

## Default Plans Created

After seeding, you'll have:
- **Free Plan** - $0/month
- **Pro Plan** - $29.99/month  
- **Enterprise Plan** - $99.99/month

## First Steps

1. Visit http://localhost:3000
2. Click "Get Started" → Register
3. Create an account
4. Login
5. View dashboard
6. Browse plans at /plans
7. Purchase a plan (simulated)

## Troubleshooting

**Can't connect to database?**
- Check MySQL is running: `mysql -u root -p`
- Verify DATABASE_URL in `.env`

**Port 3000 in use?**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Prisma errors?**
```powershell
npm run prisma:generate
```

## Development Tools

**Prisma Studio** (Database GUI):
```powershell
npm run prisma:studio
```
Opens at http://localhost:5555

## Project Structure
- `/src/pages` - Next.js pages (routes)
- `/src/pages/api` - API endpoints
- `/src/lib` - Utilities (Prisma, auth)
- `/src/styles` - CSS files
- `/prisma` - Database schema & migrations

## API Testing

Use Postman/Thunder Client or curl:

**Register:**
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**Login:**
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'
```

Save the returned `token` for authenticated requests.

**Get Dashboard (requires token):**
```powershell
curl http://localhost:3000/api/dashboard `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

- Integrate with Stripe for real payments
- Add email verification
- Implement password reset
- Add admin dashboard
- Connect with Chrome extension

Enjoy building with ProRise AI! 🚀
