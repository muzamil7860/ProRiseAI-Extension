# Admin Panel - Quick Start Guide

## 🚀 Getting Started

### Access the Admin Panel
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3001/admin/dashboard`
3. Login with an account that has `ADMIN` or `SUPER_ADMIN` role

---

## 📊 Dashboard (`/admin/dashboard`)

### Overview Cards
- **Total Users** - Count of all registered users
- **Total Revenue** - Sum of all completed purchases
- **Pending Orders** - Purchases awaiting approval
- **Total Usage** - Combined usage across all features

### Charts
1. **Revenue Trend** - Last 6 months revenue (Area chart)
2. **User Growth** - Last 6 months new users (Line chart)
3. **Usage Distribution** - Feature usage breakdown (Pie chart)

### Recent Activity
- Last 10 purchases with user info and amounts

---

## 👥 User Management (`/admin/users`)

### Features
✅ Search users by email or name
✅ Filter by role (USER, ADMIN, SUPER_ADMIN)
✅ View user stats (posts, comments, replies, rewrites)
✅ Add new users with custom roles
✅ Delete users (except yourself)
✅ Pagination (10 users per page)

### Creating a New User
1. Click **"Add New User"** button (top right)
2. Fill in the form:
   - **Email*** (required, must be unique)
   - **Name** (optional)
   - **Password*** (required, will be hashed)
   - **Role*** (USER, ADMIN, or SUPER_ADMIN)
3. Click **"Add User"**

### User Table Columns
- **User** - Avatar, name, and email
- **Role** - Badge with color (green for super admin, lighter green for admin)
- **Plan** - Current subscription package
- **Usage Stats** - All 4 feature usage counts
- **Joined** - Registration date
- **Actions** - Edit and delete buttons

---

## 📦 Package Management (`/admin/packages`)

### Features
✅ Card-based grid layout
✅ Create custom subscription packages
✅ Set monthly usage limits for all features
✅ Active/inactive toggle
✅ See how many users are on each package
✅ Edit existing packages
✅ Delete unused packages

### Creating a New Package
1. Click **"Add New Package"** button
2. Fill in the form:
   - **Package Name*** (e.g., "Premium Plan")
   - **Description** (brief explanation)
   - **Price ($)*** (e.g., 29.99)
   - **Duration (Days)*** (default: 30)
   
   **Monthly Limits:**
   - **Posts per Month*** (e.g., 50)
   - **Comments per Month*** (e.g., 100)
   - **Replies per Month*** (e.g., 100)
   - **Rewrites per Month*** (e.g., 50)
   
   - **Active** (checkbox - whether users can see/purchase it)

3. Click **"Create Package"**

### Package Cards Show
- Package name and description
- Active/Inactive status badge
- Price with duration
- All monthly limits in a grid
- User count (how many subscribers)
- Edit and Delete buttons

### Editing a Package
1. Click **"Edit"** on any package card
2. Form pre-fills with current values
3. Modify any fields
4. Click **"Update Package"**

### Deleting a Package
- Click **"Delete"** on package card
- Confirm deletion
- ⚠️ **Note**: Cannot delete packages that users are currently using

---

## 💳 Payment Management (`/admin/payments`)

### Features
✅ View all purchase transactions
✅ Filter by status (Pending, Completed, Failed)
✅ Approve pending payments (auto-assigns package)
✅ Reject payments
✅ Stats cards for quick overview
✅ Pagination (20 transactions per page)

### Overview Stats
- **Total Transactions** - All purchases ever made
- **Pending Approval** - Waiting for admin action
- **Completed** - Successfully approved payments

### Payment Table Columns
- **Transaction** - Payment method and transaction ID
- **User** - Name and email of purchaser
- **Package** - Which plan they bought
- **Amount** - Price paid (in ProRise green)
- **Status** - Badge (Yellow=Pending, Green=Completed, Red=Failed)
- **Date** - When purchase was made
- **Actions** - Approve/Reject buttons (for pending only)

### Approving a Payment
1. Find payment with **"Pending"** status
2. Click **"Approve"** button
3. Confirm action
4. System automatically:
   - Updates payment status to COMPLETED
   - Assigns package to user
   - Sets expiry date (current date + package duration)
   - Resets user stats to 0 (new billing period)

### Rejecting a Payment
1. Find payment with **"Pending"** status
2. Click **"Reject"** button
3. Confirm action
4. Payment status changes to FAILED
5. User does NOT get the package

### Filtering
- Use **status dropdown** to view only:
  - All Status
  - Pending (needs action)
  - Completed (approved)
  - Failed (rejected)

---

## 🎨 Theme & Design

### Color Scheme
- **Primary**: #7dde4f (ProRise Green) - buttons, accents
- **Dark Backgrounds**: #1a1a1a (cards), #0f0f0f (inputs)
- **Dark Borders**: #2a2a2a
- **Hover Effects**: Cards glow green on hover

### Dark Mode
- **Default**: Dark mode is ON by default
- **Toggle**: Click moon/sun icon in sidebar
- **Persistence**: Saves your preference

### Responsive Design
- **Mobile**: Stacked layout, hamburger menu
- **Tablet**: 2-column grids
- **Desktop**: Full sidebar, 3-column grids

---

## 🔐 Security Notes

### Role-Based Access
- **SUPER_ADMIN**: Full access to everything
- **ADMIN**: Full access to everything (currently same as super admin)
- **USER**: Cannot access admin panel (redirected to dashboard)

### Protected Routes
- All `/admin/*` pages require authentication
- All `/api/admin/*` endpoints check role
- Unauthorized users are redirected to login
- Insufficient permissions redirect to user dashboard

### Data Safety
- Passwords are hashed with bcrypt (never stored plain)
- Users cannot delete their own account
- Packages in use cannot be deleted
- All actions have confirmation dialogs

---

## 🐛 Troubleshooting

### Can't Access Admin Panel
- ✅ Verify you're logged in
- ✅ Check your role (must be ADMIN or SUPER_ADMIN)
- ✅ Clear browser cache/cookies
- ✅ Check console for errors

### Page Won't Load
- ✅ Ensure dev server is running (`npm run dev`)
- ✅ Check port 3001 is not blocked
- ✅ Verify database connection
- ✅ Check Prisma schema is synced

### Actions Failing
- ✅ Check browser console for error messages
- ✅ Verify API endpoint is responding
- ✅ Check database connection
- ✅ Ensure all required fields are filled

### Dark Mode Not Working
- ✅ Theme toggle in sidebar (moon/sun icon)
- ✅ Clear localStorage and refresh
- ✅ Check ThemeContext is properly loaded

---

## 📱 Navigation

### Sidebar Links
- 🏠 **Dashboard** - Overview and analytics
- 👥 **Users** - User management
- 📦 **Packages** - Plan management
- 💳 **Payments** - Transaction management
- 📊 **Analytics** - (Not yet implemented)
- ⚙️ **Settings** - (Not yet implemented)

### Top Bar
- 🌙 **Theme Toggle** - Switch dark/light mode
- 🚪 **Logout** - End session

---

## 💡 Tips & Best Practices

### User Management
- 🔹 Use search to quickly find users
- 🔹 Filter by role to manage admins separately
- 🔹 Check usage stats before making changes
- 🔹 Don't delete users with active purchases

### Package Management
- 🔹 Create multiple tiers (Basic, Pro, Premium)
- 🔹 Set realistic usage limits
- 🔹 Test packages before marking active
- 🔹 Monitor user count per package
- 🔹 Edit packages during low-traffic times

### Payment Management
- 🔹 Review pending payments daily
- 🔹 Verify transaction IDs before approving
- 🔹 Contact users before rejecting payments
- 🔹 Keep records of approval reasons
- 🔹 Filter by status for efficient workflow

---

## 🎯 Workflow Examples

### Onboarding New Premium User
1. Go to **Packages** page
2. Verify "Premium" package exists and is active
3. Go to **Users** page
4. Click "Add New User"
5. Fill in email, password, role
6. Save user
7. Wait for payment (or manually create purchase in DB)
8. Go to **Payments** page
9. Approve the payment
10. User now has Premium package activated

### Creating Subscription Tier
1. Go to **Packages** page
2. Click "Add New Package"
3. Name it (e.g., "Starter Plan")
4. Set price: $9.99
5. Set duration: 30 days
6. Set limits:
   - Posts: 10/month
   - Comments: 20/month
   - Replies: 20/month
   - Rewrites: 10/month
7. Check "Active"
8. Click "Create Package"
9. Package is now available for users

### Handling Failed Payment
1. Go to **Payments** page
2. Filter: "Pending"
3. Find suspicious transaction
4. Click "Reject"
5. Confirm rejection
6. Contact user via email (manual step)
7. Payment status → Failed
8. User does not get package

---

**Need Help?** Check the console logs or refer to `MANAGEMENT_PAGES_SUMMARY.md` for technical details.

---

**Version**: 1.0 | **Last Updated**: December 2024 | **Built with**: Next.js, TypeScript, Prisma, Tailwind CSS
