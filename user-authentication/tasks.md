# Tasks: User Authentication & Management

## 1. Backend — Dependencies & Config
- [x] 1.1 Install python-jose[cryptography], passlib[bcrypt], python-multipart, pydantic[email] into the venv
- [x] 1.2 Add SECRET_KEY and ACCESS_TOKEN_EXPIRE_MINUTES to .env and config.py

## 2. Backend — User Model
- [x] 2.1 Create User model in cartoon-care/backend/models/user_model.py (id, name, email, password_hash, role, created_at, stories relationship)
- [x] 2.2 Add user_id ForeignKey and owner relationship to existing Story model in story_model.py
- [x] 2.3 Update database.py to import and create the users table on startup
- [x] 2.4 Write a migration/seed script to assign existing stories to a default admin user

## 3. Backend — Auth Schemas
- [x] 3.1 Create auth schemas in cartoon-care/backend/app/schemas.py: RegisterRequest, LoginRequest, TokenResponse, UserResponse

## 4. Backend — JWT Service
- [x] 4.1 Create cartoon-care/backend/services/auth_service.py with JWTService (create_access_token, decode_access_token)
- [x] 4.2 Implement get_current_user and require_admin FastAPI dependency functions

## 5. Backend — Auth Service
- [x] 5.1 Implement register_user in auth_service.py (bcrypt hash, duplicate email check, return token)
- [x] 5.2 Implement authenticate_user in auth_service.py (bcrypt verify, return user or None)
- [x] 5.3 Implement get_all_users and delete_user for admin operations

## 6. Backend — Auth Routes
- [x] 6.1 Create cartoon-care/backend/routes/auth_routes.py with POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
- [x] 6.2 Add GET /auth/users (admin only) and DELETE /auth/users/{id} (admin only)
- [x] 6.3 Register auth_router in app/main.py

## 7. Backend — Protect Story Routes
- [x] 7.1 Add get_current_user dependency to all story endpoints in story_routes.py
- [x] 7.2 Modify create_story_record to accept and store current_user.id as user_id
- [x] 7.3 Modify get_all_stories to filter by user_id for regular users, return all for admins
- [x] 7.4 Modify get_story_by_id to enforce ownership (return 404 if user doesn't own it)
- [x] 7.5 Add get_current_user dependency to download and delete endpoints

## 8. Frontend — Auth API Client
- [x] 8.1 Add login, register, logout, getCurrentUser functions to cartoon-care/frontend/src/api/client.js
- [x] 8.2 Update the request helper to attach Authorization: Bearer token header from localStorage

## 9. Frontend — AuthContext
- [x] 9.1 Create cartoon-care/frontend/src/context/AuthContext.jsx with user state, token, login, register, logout, isAdmin, isLoading
- [x] 9.2 Persist JWT to localStorage and restore on page reload
- [x] 9.3 Handle 401 responses globally — clear token and redirect to /login

## 10. Frontend — ProtectedRoute Component
- [x] 10.1 Create cartoon-care/frontend/src/components/ProtectedRoute.jsx that redirects unauthenticated users to /login
- [x] 10.2 Support adminOnly prop that redirects non-admins to /dashboard

## 11. Frontend — Login & Register Pages
- [x] 11.1 Create cartoon-care/frontend/src/pages/Login.jsx with clean email/password form
- [x] 11.2 Create cartoon-care/frontend/src/pages/Register.jsx with name/email/password form
- [x] 11.3 Add inline error display and redirect logic after successful auth

## 12. Frontend — User Dashboard
- [x] 12.1 Create cartoon-care/frontend/src/pages/Dashboard.jsx showing StoryForm and user's own stories
- [x] 12.2 Replace Home page story generation with redirect to /dashboard for authenticated users

## 13. Frontend — Admin Dashboard
- [x] 13.1 Create cartoon-care/frontend/src/pages/AdminDashboard.jsx with users list and all stories list
- [x] 13.2 Add delete user and delete story functionality with confirmation

## 14. Frontend — Navbar & Routing Updates
- [x] 14.1 Update Navbar to show user name, logout button, and role-appropriate links
- [x] 14.2 Update App.jsx routes to include /login, /register, /dashboard, /admin wrapped in ProtectedRoute
- [x] 14.3 Redirect authenticated users away from /login and /register to their dashboard
