# Quick Fix: Availability Status Update Error

## Problem

Getting "Failed to update availability status" error when trying to change availability status.

## Root Cause

The backend wasn't configured to accept the new `availabilityStatus` and `website` fields.

## ✅ **Solution Applied**

### 1. **Updated Database Schema** (`server/prisma/schema.prisma`)

Added two fields to User model:

```prisma
website           String?
availabilityStatus String? @default("AVAILABLE")
```

### 2. **Updated Service Interface** (`server/src/services/user.service.ts`)

```typescript
export interface UpdateProfileInput {
  // ...existing fields
  website?: string;
  isAvailable?: boolean;
  availabilityStatus?: string;
}
```

### 3. **Updated Validation Schema** (`server/src/schemas/auth.schema.ts`)

```typescript
website: z.string()
  .url('Invalid website URL')
  .optional()
  .or(z.literal('')),
isAvailable: z.boolean()
  .optional(),
availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'OPEN_TO_WORK', 'NOT_AVAILABLE', 'FREELANCE'])
  .optional()
```

### 4. **Updated Return Fields**

Both `getUserById` and `updateProfile` now return:

- `website`
- `isAvailable`
- `availabilityStatus`

---

## 🚀 **Required Steps to Complete Fix**

### **Run Database Migration:**

```bash
cd server
npx prisma migrate dev --name add_website_and_availability_fields
```

This will:

1. Create migration SQL file
2. Apply changes to database (adds `website` and `availabilityStatus` columns)
3. Regenerate Prisma Client

### **Restart Server:**

```bash
# If running with npm
npm run dev

# If running with nodemon
nodemon src/index.ts
```

---

## 📝 **What This Fixes**

### **Before (Error):**

- Clicking availability badge → "Failed to update availability status"
- Backend rejected `availabilityStatus` field

### **After (Working):**

✅ Can change availability status from dropdown
✅ Status saves to database
✅ Status persists across page reloads
✅ Toast notification confirms update
✅ Website field also works in profile edit

---

## 🧪 **Testing**

After running the migration:

1. **Test Availability Change:**

   - Go to your profile
   - Click on availability badge (e.g., "Available for projects")
   - Select different status
   - Should see success toast
   - Refresh page - status should persist

2. **Test Website Field:**
   - Click "Edit Profile"
   - Add website URL
   - Save
   - Should save successfully

---

## 🔍 **Verify Migration Success**

Check if columns were added:

```bash
cd server
npx prisma studio
```

Look for:

- `website` column in users table
- `availabilityStatus` column in users table

---

## ⚠️ **If Migration Fails**

If you get an error during migration, you might need to:

### Option 1: Reset Database (Development Only!)

```bash
cd server
npx prisma migrate reset
```

⚠️ **Warning**: This will delete all data!

### Option 2: Manual Migration

```bash
cd server
npx prisma db push
```

This skips migration history and directly syncs schema.

---

## 📊 **Database Changes**

### **SQL Generated (approximate):**

```sql
-- Add website column
ALTER TABLE "users" ADD COLUMN "website" TEXT;

-- availabilityStatus already added in previous migration
-- If not, it would be:
-- ALTER TABLE "users" ADD COLUMN "availabilityStatus" TEXT DEFAULT 'AVAILABLE';
```

---

## 🎯 **Summary**

**Files Modified:**

1. ✅ `server/prisma/schema.prisma` - Added fields
2. ✅ `server/src/services/user.service.ts` - Updated interface & selects
3. ✅ `server/src/schemas/auth.schema.ts` - Added validation
4. ✅ `server` - Ran `npx prisma generate`

**Still Needed:**

- Run `npx prisma migrate dev --name add_website_and_availability_fields`
- Restart server

**Result:**

- Availability status updates will work
- Website field will be editable
- All profile fields will save correctly

---

**Quick Command:**

```bash
cd server && npx prisma migrate dev --name add_website_and_availability_fields && npm run dev
```

This single command will:

1. Run the migration
2. Start the server

Then test the availability status change on your profile!
