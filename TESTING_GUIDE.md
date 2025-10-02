# Testing Guide: Project Invitation System

## Prerequisites

- Two user accounts (User A and User B)
- User A should be logged in initially

## Test Scenario 1: Successful Invitation Flow

### Step 1: Send Invitation (User A)

1. Log in as **User A**
2. Go to your project
3. Click on "Members" tab
4. Click "Invite Member" button
5. Search for **User B** by name or email
6. Select a role (ADMIN or MEMBER)
7. Add optional message
8. Click "Send Invitation"
9. ✅ **Expected**: Success message appears

### Step 2: View Invitation (User B)

1. Log out and log in as **User B**
2. Go to **Invitations** page (click bell icon or /invitations route)
3. ✅ **Expected**: See invitation from User A with:
   - Project name
   - Invitation message
   - Role offered
   - Who sent it
   - When it was sent

### Step 3: Preview Project (User B)

1. Still as **User B**
2. Click on the project name in the invitation
3. ✅ **Expected**: Can view project details including:
   - Project description
   - GitHub repository (if linked)
   - Project owner info
   - **BUT CANNOT**: Edit project, create tasks, or manage members

### Step 4: Accept Invitation (User B)

1. Go back to invitations page
2. Click "Accept" button on the invitation
3. ✅ **Expected**:
   - Success message appears
   - Invitation disappears from list
   - Redirected to project page
   - Now appears as a member

### Step 5: Verify Member Access (User B)

1. Still as **User B**, you're now on the project page
2. ✅ **Expected**: Can now:
   - View all project details
   - See tasks
   - Create tasks (if permission allows)
   - View code repository
   - See all members

## Test Scenario 2: Decline Invitation

### Step 1: Send Another Invitation

1. Log in as **User A**
2. Create a new project or use existing one
3. Send invitation to **User B**

### Step 2: Decline (User B)

1. Log in as **User B**
2. Go to invitations page
3. Click "Decline" button
4. ✅ **Expected**:
   - Invitation disappears
   - Can no longer access the project
   - Trying to visit project URL shows "Access Denied"

## Test Scenario 3: Multiple Invitations

### Test Setup

1. User A sends invitations to User B for **3 different projects**

### Verification

1. Log in as User B
2. Go to invitations page
3. ✅ **Expected**: See all 3 invitations
4. ✅ **Expected**: Badge shows "3" on notifications icon
5. Accept 1 invitation
6. ✅ **Expected**: Badge now shows "2"
7. Decline 1 invitation
8. ✅ **Expected**: Badge now shows "1"

## Test Scenario 4: Duplicate Invitation Prevention

### Test Steps

1. Log in as **User A**
2. Send invitation to **User B** for Project X
3. Try to send another invitation to **User B** for the same Project X
4. ✅ **Expected**: Error message: "User already invited or is a member"

## Test Scenario 5: Edge Cases

### Case 1: Invitation to Existing Member

1. User B is already a member of Project X
2. User A tries to invite User B to Project X
3. ✅ **Expected**: Error message

### Case 2: Deleted Project

1. User A sends invitation to User B for Project X
2. User A deletes Project X
3. User B logs in and checks invitations
4. ✅ **Expected**: Invitation automatically removed (Cascade delete)

### Case 3: Removed from Project After Invitation

1. User A sends invitation to User B
2. User B accepts and becomes a member
3. User A removes User B from the project
4. ✅ **Expected**: User B can no longer access the project

## API Endpoints to Test

### 1. Get Pending Invitations

```bash
GET /api/projects/invitations/pending
Authorization: Bearer <user-b-token>

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": "invitation-id",
      "project": {
        "id": "project-id",
        "name": "Project Name",
        "description": "Project Description"
      },
      "role": "MEMBER",
      "message": "Join us!",
      "sentAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

### 2. Respond to Invitation

```bash
PUT /api/projects/invitations/:invitationId/respond
Authorization: Bearer <user-b-token>
Content-Type: application/json

{
  "status": "ACCEPTED"  // or "DECLINED"
}

Expected Response (Accept):
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "project": { /* project details */ }
  }
}
```

### 3. View Project (With Pending Invitation)

```bash
GET /api/projects/:projectId
Authorization: Bearer <user-b-token>

Expected Response: Project details (even though not a member yet)
```

## Common Issues and Solutions

### Issue 1: "Project not found or access denied"

**Cause**: Old code didn't allow invited users to view projects  
**Fix**: ✅ Now fixed - invited users can preview projects

### Issue 2: Invitations not showing

**Cause**: Frontend not fetching invitations  
**Fix**: Check that `/invitations` page is fetching from correct API endpoint

### Issue 3: Badge count not updating

**Cause**: Not refetching after accept/decline  
**Fix**: Ensure `refetchInvitations()` is called after actions

## Performance Testing

### Load Test

1. Create 50 invitations for a single user
2. Load invitations page
3. ✅ **Expected**: Page loads in < 2 seconds
4. ✅ **Expected**: All invitations displayed correctly

### Concurrent Actions

1. User A sends invitation
2. At same time, User B is viewing invitations page
3. ✅ **Expected**: New invitation appears after page refresh

## Security Testing

### Test 1: Access Control

- Try to accept invitation with wrong user token
- ✅ **Expected**: 401 Unauthorized

### Test 2: Invitation Ownership

- Try to accept invitation meant for another user
- ✅ **Expected**: 403 Forbidden

### Test 3: Expired Tokens

- Use expired JWT token
- ✅ **Expected**: 401 Unauthorized

## Success Criteria

All tests should pass with:

- ✅ No console errors
- ✅ Proper error messages shown to users
- ✅ Smooth UI transitions
- ✅ Data consistency across actions
- ✅ Proper access control enforced
