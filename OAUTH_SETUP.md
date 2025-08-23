# OAuth Setup Guide - LinkedIn & Google Authentication

This guide explains how to set up OAuth authentication for LinkedIn and Google, including obtaining API keys and configuring callback URLs.

## Table of Contents
- [LinkedIn OAuth Setup](#linkedin-oauth-setup)
- [Google OAuth Setup](#google-oauth-setup)
- [Environment Variables](#environment-variables)
- [Callback URLs Configuration](#callback-urls-configuration)
- [Testing OAuth Flow](#testing-oauth-flow)

## LinkedIn OAuth Setup

### 1. Create LinkedIn App

1. **Go to LinkedIn Developers**
   - Visit: https://www.linkedin.com/developers/
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click "Create App"
   - Fill in the required information:
     - **App name**: NetworkHub (or your preferred name)
     - **LinkedIn Page**: Create a LinkedIn company page or use personal page
     - **App logo**: Upload your app logo
     - **Legal agreement**: Accept the terms

3. **Configure App Settings**
   - Go to the "Auth" tab
   - Add **Authorized redirect URLs**:
     ```
     http://localhost:5000/api/auth/linkedin/callback
     https://yourdomain.com/api/auth/linkedin/callback
     ```

4. **Get Client Credentials**
   - **Client ID**: Found in the "Auth" tab
   - **Client Secret**: Found in the "Auth" tab (keep this secure!)

5. **Request Permissions**
   - Go to "Products" tab
   - Add "Sign In with LinkedIn using OpenID Connect"
   - Wait for approval (usually instant for basic profile access)

### 2. LinkedIn Scopes Required
- `openid`
- `profile`
- `email`

## Google OAuth Setup

### 1. Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - **Project name**: NetworkHub
   - **Organization**: Your organization (optional)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "People API"
   - Click on it and press "Enable"

### 2. Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in the required information:
     - **App name**: NetworkHub
     - **User support email**: Your email
     - **Developer contact email**: Your email
     - **App domain**: Your domain (optional for testing)

2. **Add Scopes**
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`

3. **Add Test Users** (for development)
   - Add your email and other test user emails

### 3. Create OAuth Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Client**
   - **Application type**: Web application
   - **Name**: NetworkHub Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback
     ```

3. **Get Client Credentials**
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value (keep secure!)

## Environment Variables

Create a `.env` file in your server directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/networking-platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id-here
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret-here

# Optional: Cloudinary for image uploads
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

## Callback URLs Configuration

### Current Callback Structure

Based on your auth routes, the callback URLs are:

#### LinkedIn Callback
```
GET /api/auth/linkedin/callback
```
- **Development**: `http://localhost:5000/api/auth/linkedin/callback`
- **Production**: `https://yourdomain.com/api/auth/linkedin/callback`

#### Google Callback
```
GET /api/auth/google/callback
```
- **Development**: `http://localhost:5000/api/auth/google/callback`
- **Production**: `https://yourdomain.com/api/auth/google/callback`

### Frontend Callback Handling

Your frontend has an `AuthCallback` component at `/auth/callback` that handles the OAuth response:

```typescript
// Frontend route for handling OAuth success/failure
http://localhost:3000/auth/callback?token=ACCESS_TOKEN&refresh=REFRESH_TOKEN
```

### OAuth Flow

1. **User clicks OAuth button** → Redirects to provider (LinkedIn/Google)
2. **User authorizes app** → Provider redirects to callback URL
3. **Server receives callback** → Processes auth and generates tokens
4. **Server redirects to frontend** → With tokens in query params
5. **Frontend AuthCallback component** → Extracts tokens and redirects to app

## Testing OAuth Flow

### 1. Local Development Setup

1. **Start your servers**:
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev

   # Terminal 2: Start frontend  
   cd client
   npm run dev
   ```

2. **Test URLs**:
   - LinkedIn: `http://localhost:3000/login` → Click "Continue with LinkedIn"
   - Google: `http://localhost:3000/login` → Click "Continue with Google"

### 2. Verification Steps

1. **Check environment variables are loaded**
2. **Verify callback URLs match exactly** in OAuth provider settings
3. **Test the complete flow**:
   - Click OAuth button
   - Authorize on provider site
   - Should redirect back with success message
   - Check browser network tab for any errors

### 3. Common Issues & Solutions

#### "OAuth not configured" error
- Check if environment variables are properly set
- Verify `.env` file is in the correct location
- Restart the server after adding environment variables

#### "Invalid redirect URI" error
- Ensure callback URLs in provider settings exactly match your server URLs
- Check for trailing slashes, http vs https, port numbers

#### "App not approved" error (LinkedIn)
- Make sure you've requested the correct products/permissions
- For development, basic profile access is usually auto-approved

## Security Best Practices

1. **Keep secrets secure**:
   - Never commit `.env` files to version control
   - Use different credentials for development and production
   - Rotate secrets regularly

2. **Configure proper domains**:
   - Only add trusted domains to authorized origins
   - Use HTTPS in production
   - Validate redirect URIs server-side

3. **Monitor usage**:
   - Set up quotas and monitoring in provider consoles
   - Log OAuth events for debugging
   - Handle rate limiting gracefully

## Production Deployment

When deploying to production:

1. **Update environment variables** with production values
2. **Update callback URLs** in OAuth provider settings
3. **Use HTTPS** for all OAuth flows
4. **Configure proper CORS** settings
5. **Set up domain verification** if required by providers

## Additional Resources

- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js LinkedIn Strategy](http://www.passportjs.org/packages/passport-linkedin-oauth2/)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
