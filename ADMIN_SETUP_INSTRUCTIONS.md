# Admin Dashboard Setup Instructions

## Overview
The METAR Converter application now includes a comprehensive admin dashboard with the following features:

### Features
1. **User Approval System** - Approve or reject pending user registrations with automatic email notifications
2. **System Settings Management** - Configure default IWXXM conversion parameters for all users
3. **System Monitoring** - View all users, database statistics, and grant/revoke admin privileges
4. **Seamless Navigation** - Switch between Admin Dashboard and File Converter with dedicated buttons
5. **Permission Checking** - Non-admin users get clear error messages when attempting admin access

## Creating the First Admin User

Since admin users can only be created by other admins or manually in the database, follow these steps to create your first administrator:

### Option 1: Direct Database Entry (Recommended)

1. Register a new user account through the application
2. Verify the email address
3. Access your Supabase dashboard at: https://supabase.com/dashboard/project/ktvxijislbtgqapllmuk/database/tables
4. Open the `kv_store_2e3cda33` table
5. Find the record where `key` starts with `user_profile:` for your user
6. Edit the `value` JSON field and set:
   ```json
   {
     ...existing fields...,
     "is_admin": true,
     "approval_status": "approved"
   }
   ```
7. Save the changes
8. Log in with your account - you'll now have access to the Admin Dashboard

### Option 2: Using Server Function (Advanced)

You can also use the Supabase SQL Editor to create an admin user:

```sql
-- Update a user's profile to make them an admin
UPDATE kv_store_2e3cda33
SET value = jsonb_set(
  jsonb_set(value, '{is_admin}', 'true'::jsonb),
  '{approval_status}', '"approved"'::jsonb
)
WHERE key LIKE 'user_profile:%' 
AND value->>'email' = 'your-email@example.com';
```

## Admin Dashboard Features

### 1. User Approval Panel
- View all pending user registrations
- Approve users (sends approval email automatically)
- Reject users (sends rejection email automatically)
- Search/filter users by email or username

### 2. System Settings Panel
- Configure default IWXXM conversion parameters:
  - Bulletin ID
  - Issuing Center (ICAO code)
  - IWXXM Version (2.1, 3.0, 2023-1)
  - Error handling behavior
  - Log level
  - Validation options
- Manage allowed ICAO codes (leave empty to allow all)
- Changes apply to all users as default values

### 3. Monitoring Panel
- View all registered users with their status
- See statistics:
  - Total users
  - Approved/Pending/Rejected counts
  - Number of administrators
- Grant or revoke admin privileges to other users
- Filter users by approval status

## Email Notifications

The system automatically sends email notifications for:
- **Approval**: When an admin approves a user registration
- **Rejection**: When an admin rejects a user registration

**Note**: Email notifications are currently logged to the server console. In production, you would integrate with an email service like SendGrid, Resend, or Amazon SES by updating the `/supabase/functions/server/admin.tsx` file's `sendEmailNotification` function.

## Security

- All admin endpoints require authentication AND admin status
- Admin status is checked on every admin API call
- Only admins can:
  - Approve/reject users
  - Modify system settings
  - Grant/revoke admin privileges
  - View all user information

## Access Control

Users are redirected based on their role:
- **Regular users** → File Converter interface (conversion features only)
- **Admin users** → File Converter interface (with Admin Dashboard button for system controls)

### Navigation Between Views

**For Admin Users:**
- Upon login, admins start at the **File Converter** (same as regular users)
- Admins see a purple **"Admin Dashboard"** button in the converter header
- Click "Admin Dashboard" to access admin controls (user approvals, system settings, monitoring)
- Click "File Converter" button in the admin dashboard header to return to converter
- **Full access to both conversion features AND admin controls**

**For Regular Users:**
- Upon login, regular users are directed to the File Converter
- **No admin button visible** (the Admin Dashboard button is hidden)
- If they try to access the Admin Dashboard (via direct API calls), they receive an error:
  - **"Sorry, you don't have permissions for that."**
  - **"Admin access is required to view the dashboard."**
- Access limited to conversion features only

### UI/UX Features:
- **Conversion Parameters**: Now minimized by default - click the chevron to expand
- **Purple Admin Buttons**: Consistent purple color scheme for all admin-related actions
- **Blue Converter Buttons**: Blue color scheme for converter navigation
- **Permission Error Messages**: Clear, user-friendly error messages for unauthorized access attempts
- **Bi-directional Navigation**: Admins can easily switch between converter and dashboard
- **Unified Experience**: Admins get the same converter interface plus additional admin capabilities

## Database Structure

All data is stored in the `kv_store_2e3cda33` table with the following key prefixes:
- `user_profile:<user_id>` - User profiles with approval status and admin flag
- `system:settings` - System-wide configuration
- `email:<timestamp>:<email>` - Email notification logs

## Technical Details

### Backend Files Created:
- `/supabase/functions/server/admin.tsx` - Admin utilities and email notifications
- Updated `/supabase/functions/server/auth.tsx` - Added admin-related auth functions
- Updated `/supabase/functions/server/index.tsx` - Added admin API endpoints

### Frontend Files Created:
- `/src/app/components/admin/AdminDashboard.tsx` - Main admin dashboard
- `/src/app/components/admin/UserApprovalPanel.tsx` - User approval interface
- `/src/app/components/admin/SystemSettingsPanel.tsx` - Settings management
- `/src/app/components/admin/MonitoringPanel.tsx` - User monitoring and stats

### API Endpoints:
- `GET /admin/pending-users` - Get pending user registrations
- `POST /admin/approve-user` - Approve a user
- `POST /admin/reject-user` - Reject a user
- `GET /admin/all-users` - Get all users
- `GET /admin/stats` - Get system statistics
- `POST /admin/toggle-admin` - Grant/revoke admin status
- `GET /admin/settings` - Get system settings
- `POST /admin/settings` - Save system settings