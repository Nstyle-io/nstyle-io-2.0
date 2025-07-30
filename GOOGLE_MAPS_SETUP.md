# 🗺️ Google Maps API Setup - FIXING WHITE BOX ISSUE

## 🚨 WHITE BOX PROBLEM? 

The white box you're seeing is **100% an API key configuration issue**. Follow this guide to fix it.

## Quick Fix Steps

### 1. Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Enable billing** (required even for free tier)
4. Go to "APIs & Services" > "Library" and enable:
   - **Maps JavaScript API** ✅
   - **Places API** ✅
5. Go to "APIs & Services" > "Credentials"
6. Click "Create Credentials" > "API Key"
7. Copy your API key (starts with `AIza...`)

### 2. Configure Your API Key

**Option A: Local Environment (Recommended)**
1. Create `.env.local` file in project root:
```bash
# Add your actual API key here (39 characters starting with AIza)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD8kYv4k5n4z8r7x2m5p3q9s1t6u4w8e9r
```

**Option B: Supabase Edge Function**
1. In Supabase dashboard > Edge Functions > Settings
2. Add: `GOOGLE_MAPS_API_KEY=your_key_here`

### 3. Restart Development Server
```bash
cd frontend
npm run dev
```

## ✅ Verification Checklist

Open browser console (F12) and check:
- [ ] No "RefererNotAllowedMapError" 
- [ ] No "InvalidKeyMapError"
- [ ] See: "GoogleMapsInterface: Map initialized successfully"
- [ ] API key is 39 characters starting with "AIza"

## 🔧 Advanced Troubleshooting

### Still White Box? Check These:

1. **API Key Format**: Should be exactly 39 characters starting with `AIzaSy`
2. **Billing Enabled**: Google requires billing even for free usage
3. **APIs Enabled**: Both Maps JavaScript API AND Places API must be enabled
4. **Browser Console**: Check for specific error messages

### Common Error Messages:
- `This page didn't load Google Maps correctly` → Billing issue
- `API key not valid` → Wrong key or format
- `RefererNotAllowedMapError` → Domain restrictions too strict

### 6. Alternative: Supabase Function Configuration

If you prefer to store the API key in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" > "Settings"
3. Add environment variable:
   - Key: `GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key

## Troubleshooting

### Common Issues

1. **Map not loading**: Check if billing is enabled in Google Cloud
2. **API key errors**: Verify the key is correct and APIs are enabled
3. **Quota exceeded**: Check your usage in Google Cloud Console
4. **Referrer restrictions**: Ensure your domain is whitelisted

### Error Messages

- `This page didn't load Google Maps correctly` - Usually billing or API key issue
- `API key not valid` - Check key format and restrictions
- `This API project is not authorized` - Enable required APIs

### Testing Your Setup

1. Open browser developer tools
2. Navigate to the Discover page
3. Check console for any Google Maps errors
4. Verify map loads and shows your location

## Cost Considerations

Google Maps APIs have usage-based pricing:
- Maps JavaScript API: $7 per 1,000 loads
- Places API: $32 per 1,000 requests (basic data)
- First $200/month is free credit

Monitor usage in Google Cloud Console to avoid unexpected charges.