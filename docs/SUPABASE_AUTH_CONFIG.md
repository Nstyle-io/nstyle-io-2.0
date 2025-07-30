# Supabase Authentication Configuration

## Important Configuration for Magic Links

For magic links to work properly, you need to configure the following in your Supabase dashboard:

### 1. Email Templates
Go to Authentication → Email Templates in your Supabase dashboard and ensure:
- **Confirm signup** template is enabled
- The template contains a proper magic link URL

### 2. URL Configuration
In Authentication → URL Configuration:
- Add `http://localhost:5173` to the **Redirect URLs** (for development)
- Add your production domain to the **Redirect URLs** (for production)
- The Site URL should be set to your app's URL

### 3. Email Settings
In Authentication → Providers → Email:
- Ensure **Enable Email Signup** is turned ON
- **Enable Email Confirmations** should be OFF for instant magic links
- **Enable Double Opt-in** should be OFF

### 4. SMTP Configuration (Optional but Recommended)
For reliable email delivery:
- Configure custom SMTP settings in Authentication → SMTP Settings
- Or use a service like SendGrid, Mailgun, etc.

### 5. Security Settings
In Authentication → Security:
- Set appropriate rate limits for email sending
- Configure trusted domains if needed

## Troubleshooting Magic Links

If magic links are not working:

1. **Check Browser Console**: Look for any errors when sending the magic link
2. **Check Email Delivery**: 
   - Check spam/junk folder
   - Verify email address is correct
   - Check Supabase logs for email sending issues
3. **Verify Redirect URL**: Make sure the redirect URL in the code matches what's configured in Supabase
4. **Check Network Tab**: Look for the auth request and response
5. **Test with Different Email**: Try a different email provider (Gmail, Outlook, etc.)

## Session Persistence

The app is configured to persist sessions using:
- `localStorage` for token storage
- `autoRefreshToken: true` for automatic token refresh
- `detectSessionInUrl: true` for handling magic link callbacks
- `flowType: 'pkce'` for enhanced security

Sessions will persist until:
- User explicitly logs out
- Token expires (default: 1 week, configurable in Supabase)
- Browser data is cleared

## Testing Magic Links Locally

1. Start your development server: `npm run dev`
2. Go to the login page
3. Enter your email address
4. Click "Send Magic Link"
5. Check your email and click the link
6. You should be automatically logged in and redirected to the feed

## Common Issues and Solutions

### "Invalid token" error
- The magic link may have expired (default: 1 hour)
- Request a new magic link

### Not redirecting after clicking link
- Check that your redirect URL is properly configured
- Ensure the auth state listener is working
- Check browser console for errors

### Email not received
- Check spam folder
- Verify email settings in Supabase
- Check Supabase email logs
- Consider using custom SMTP