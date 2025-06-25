# Deployment Guide

## Firebase Environment Variables Issue

The error `auth/invalid-api-key` occurs because Firebase environment variables are not available during deployment.

## How to Fix

### 1. Add Environment Variables to Your Deployment Platform

#### For Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAgH3uDdLf2bowG3hYjXfHLW_tHYsJjPLE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=supportor-belt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=supportor-belt
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=supportor-belt.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=103170289237
NEXT_PUBLIC_FIREBASE_APP_ID=1:103170289237:web:3894277cf891c2a27a2edc
NEXT_PUBLIC_API_URL=https://your-production-api-url.com/api
```

#### For Netlify:
1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add the same environment variables as above

#### For Other Platforms:
Add the environment variables to your platform's configuration.

### 2. Redeploy Your Application

After adding the environment variables, redeploy your application.

### 3. Verify Firebase Configuration

Make sure your Firebase project is properly configured:
1. Check that your Firebase project exists and is active
2. Verify that Authentication is enabled in your Firebase console
3. Ensure your domain is added to the authorized domains in Firebase

## Alternative Solution

If you continue to have issues, you can also:

1. Create a `.env.production` file in your project root with the same variables
2. Make sure this file is included in your deployment (but not committed to git)

## Security Notes

- Never commit your `.env.local` file to version control
- The `NEXT_PUBLIC_` prefix makes these variables available to the client-side code
- These are safe to expose as they are meant to be public for client-side Firebase SDK

## Testing Locally

To test your deployment locally:

```bash
npm run build
npm start
```

This will simulate the production build process and help identify any issues before deployment. 