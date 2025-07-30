# Google OAuth Setup for Supabase

## Prerequisites
You need to configure Google OAuth in both Google Cloud Console and Supabase Dashboard.

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in the required fields (app name, support email, etc.)
     - Add your domain to authorized domains
     - Save and continue

5. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Your App Name"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production domain
   - Authorized redirect URIs:
     - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - Find your project reference in Supabase Dashboard URL
   - Click "Create"

6. Save your credentials:
   - Client ID: `YOUR_GOOGLE_CLIENT_ID`
   - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`

## Step 2: Supabase Configuration

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to Authentication → Providers
3. Find Google in the list and enable it
4. Enter your Google OAuth credentials:
   - Client ID: Paste your Google Client ID
   - Client Secret: Paste your Google Client Secret
5. Click "Save"

## Step 3: Update Redirect URLs

In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add to Site URL: `http://localhost:5173` (for development)
3. Add to Redirect URLs:
   - `http://localhost:5173`
   - `http://localhost:5173/`
   - Your production URLs

## Step 4: Verify Implementation

The code is already set up correctly in the app:
```typescript
// useSocialAuth.tsx
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/`,
  },
});
```

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**
   - Make sure the redirect URI in Google Console matches exactly with Supabase's callback URL
   - The format is: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

2. **"Invalid client" error**
   - Double-check that Client ID and Client Secret are correctly copied
   - Ensure there are no extra spaces

3. **Nothing happens when clicking Google button**
   - Check browser console for errors
   - Verify Google provider is enabled in Supabase
   - Check if popup blockers are preventing the OAuth window

4. **User is not redirected after login**
   - Verify redirect URLs in Supabase include your app URL
   - Check auth state listeners in the app

### Testing Google OAuth:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Click the Google sign-in button
4. Look for console messages:
   - "Google sign-in clicked"
   - "Google sign-in result: ..."
   - Any error messages

### Additional Debugging:

To see more detailed errors, check:
1. Browser Console for JavaScript errors
2. Network tab for failed requests
3. Supabase Dashboard → Authentication → Logs

## Security Notes

- Never commit your Client Secret to version control
- Use environment variables for production deployments
- Regularly rotate your OAuth credentials
- Monitor usage in Google Cloud Console