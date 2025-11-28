# Database Initialization Guide

## Quick Start - Clean Database Setup

### Option 1: Automatic (Recommended)

The default admin user is automatically created when the API starts for the first time.

**Default Admin Credentials:**

- Email: `admin@neighborwatch.rw`
- Password: `admin@123A`

### Option 2: Manual Reset (Clear All Data)

If you need to reset the database and remove all users except the default admin:

**Using Docker:**

```bash
# Run the initialization script in the API container
docker exec -it neighborwatch-api python init_db.py
```

**Without Docker:**

```bash
# Navigate to api directory
cd api

# Run the initialization script
python init_db.py
```

**When prompted, type `yes` to confirm.**

This will:

- ✅ Delete all existing users
- ✅ Delete all reports, chats, alerts, and clusters
- ✅ Create the default admin user
- ✅ Create necessary database indexes

## Creating Your Own Users

### 1. Admin User (Already Created)

- Email: admin@neighborwatch.rw
- Password: admin@123A
- Login at: https://ibiguruka.vercel.app/admin-login

### 2. Police Officers

Police officers can register themselves:

- Go to: https://ibiguruka.vercel.app/police-login
- Click "Register" tab
- Fill in:
  - Full Name
  - Badge Number (e.g., PO-12345)
  - Phone Number
  - Email
  - Password
- Click "Register as Police Officer"

### 3. Citizens

Citizens can register through:

- Go to: https://ibiguruka.vercel.app/login
- Click "Create new account"
- Fill in email, phone, and password
- Or click "Continue Anonymously" to use without registration

### 4. Creating Users via API

**Using cURL:**

```bash
# Create a police officer
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "officer@police.gov.rw",
    "password": "SecurePass123!",
    "phone": "+250788000001",
    "full_name": "John Officer",
    "badge_number": "PO-001",
    "role": "police"
  }'

# Create a citizen
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@example.com",
    "password": "SecurePass123!",
    "phone": "+250788000002",
    "full_name": "Jane Doe",
    "role": "citizen"
  }'
```

**Using API Documentation (Swagger):**

1. Go to: http://localhost:8000/docs
2. Expand `POST /api/auth/register`
3. Click "Try it out"
4. Fill in the user details
5. Click "Execute"

## User Roles

### Anonymous

- Can submit reports
- Can view public safety map
- Cannot chat or view report history

### Citizen (Registered)

- All anonymous features PLUS:
- View personal report history
- Chat with police about reports
- Edit profile

### Police Officer

- View all reports
- Access dashboard with clusters
- Update report status
- Chat with citizens
- Broadcast alerts

### Administrator

- All police features PLUS:
- Manage user accounts
- View system analytics
- Manage categories
- Trigger manual clustering

## Verification

After initialization, verify the admin user exists:

```bash
# Using MongoDB shell
docker exec -it neighborwatch-mongodb mongosh

use neighborwatch
db.users.findOne({email: "admin@neighborwatch.rw"})
```

You should see the admin user with role "admin" and is_active: true.

## Troubleshooting

### Issue: "Admin user already exists"

This is normal - the admin is only created once. To reset, run the `init_db.py` script.

### Issue: Cannot login with admin credentials

1. Verify the API is running: http://localhost:8000/health
2. Check API logs: `docker logs neighborwatch-api`
3. Run database initialization: `docker exec -it neighborwatch-api python init_db.py`

### Issue: Database connection error

1. Check MongoDB is running: `docker ps | grep mongodb`
2. Restart containers: `docker-compose restart`

## Production Deployment

⚠️ **IMPORTANT for Production:**

1. **Change the default admin password immediately after first login**
2. Use strong passwords for all users (min 8 characters, mixed case, numbers, symbols)
3. Set a strong `SECRET_KEY` in environment variables
4. Use HTTPS only
5. Enable email verification
6. Implement rate limiting on registration endpoints

## Summary

✅ Default admin user is created automatically: `admin@neighborwatch.rw` / `admin@123A`  
✅ No mock or demo users exist  
✅ All users are created through registration  
✅ Clean slate ready for your real data
