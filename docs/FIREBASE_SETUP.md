# Firebase Integration Setup Guide

This guide will help you set up Firebase alongside your existing Supabase integration in NStyle.

## 🔥 Firebase Configuration

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "nstyle-app")
4. Enable Google Analytics if desired
5. Complete the setup

### 2. Get Firebase Configuration

1. In the Firebase Console, click the gear icon ⚙️ and select "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Register your app with a nickname (e.g., "NStyle Web")
5. Copy the Firebase configuration object

### 3. Update Firebase Config

Edit `src/integrations/firebase/config.ts` and replace the placeholder values:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // Optional, for Analytics
};
```

## 🔧 Enable Firebase Services

### Authentication
1. In Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable other providers (Google, Facebook, etc.)

### Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose security rules (start in test mode for development)
4. Select a location

### Storage
1. In Firebase Console → Storage
2. Click "Get started"
3. Review security rules
4. Choose a location

### Analytics (Optional)
1. In Firebase Console → Analytics
2. Enable Analytics if not already done during project creation

## 🏗️ Integration Architecture

### Coexistence Strategy

This integration is designed to work alongside Supabase:

- **Primary Backend**: Supabase (existing salon management data)
- **Firebase Features**: Additional services like analytics, real-time chat, file storage
- **Unified Auth**: Choose between Firebase Auth or Supabase Auth via BackendSwitcher

### Service Separation

```
┌─ Supabase Services ─┐    ┌─ Firebase Services ─┐
│ • Salon Profiles    │    │ • User Analytics    │
│ • Appointments      │    │ • Real-time Chat    │
│ • Services          │    │ • File Storage      │
│ • Staff Management  │    │ • Social Features   │
└─────────────────────┘    └─────────────────────┘
```

## 🚀 Usage Examples

### Test the Integration

Visit `/firebase-demo` to test all Firebase features:

1. **Authentication**: Sign up/in with Firebase Auth
2. **Firestore**: Add and read data from collections
3. **Storage**: Upload files to Firebase Storage
4. **Analytics**: Track custom events and page views
5. **Backend Switching**: Toggle between Firebase and Supabase

### Code Examples

#### Using Firebase Auth
```typescript
import { FirebaseAuthService } from '@/integrations/firebase';

const { user, error } = await FirebaseAuthService.signIn(email, password);
```

#### Using Firestore
```typescript
import { FirestoreService } from '@/integrations/firebase';

// Add document
const result = await FirestoreService.addDocument('posts', {
  title: 'My Post',
  content: 'Hello World',
  userId: user.uid
});

// Query documents
const posts = await FirestoreService.getDocuments('posts', [
  FirestoreService.whereEqual('userId', user.uid),
  FirestoreService.orderByField('createdAt', 'desc'),
  FirestoreService.limitResults(10)
]);
```

#### Using Firebase Storage
```typescript
import { FirebaseStorageService } from '@/integrations/firebase';

const result = await FirebaseStorageService.uploadFile(
  `images/${Date.now()}-${file.name}`,
  file
);
```

#### Using Analytics
```typescript
import { FirebaseAnalyticsService } from '@/integrations/firebase';

// Track events
FirebaseAnalyticsService.logEvent('button_click', {
  button_name: 'book_appointment',
  salon_id: salonId
});

// Track page views
FirebaseAnalyticsService.trackPageView('salon_profile', 'Salon Profile Page');
```

## 🔄 Migration Strategy

### Gradual Migration Approach

1. **Phase 1**: Add Firebase alongside Supabase (current state)
2. **Phase 2**: Migrate specific features (e.g., file storage, analytics)
3. **Phase 3**: Migrate user data (if desired)
4. **Phase 4**: Complete migration (optional)

### Data Migration Tools

The `UnifiedAuthService` provides methods to work with both backends:

```typescript
import { UnifiedAuthService } from '@/services/unified-auth';

// Works with either Firebase or Supabase based on current selection
const { user, error } = await UnifiedAuthService.signIn(email, password);
```

## 🛡️ Security Considerations

### Firebase Security Rules

**Firestore Rules** (basic example):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public posts
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules** (basic example):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /user-uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Environment Variables

Never commit your Firebase config to public repositories. Consider using environment variables for production:

```typescript
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... other config
};
```

## 📊 Monitoring and Analytics

### Firebase Console
- Monitor usage in Firebase Console
- Set up alerts for errors or unusual activity
- Review Analytics data for user behavior insights

### Performance Monitoring
Enable Performance Monitoring in Firebase Console to track:
- Page load times
- Network requests
- App startup time

## 🔗 Useful Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security](https://firebase.google.com/docs/storage/security)

## 🆘 Troubleshooting

### Common Issues

1. **"Firebase app not initialized"**
   - Check if your config values are correct
   - Ensure you've called `initializeApp()`

2. **Permission denied errors**
   - Review your Firestore/Storage security rules
   - Ensure user is authenticated

3. **Analytics not working**
   - Analytics only works in browser environment
   - Check if measurementId is included in config

4. **CORS errors**
   - Configure your domain in Firebase Console → Authentication → Settings
   - Add your domain to authorized domains

### Getting Help

- Check the Firebase Console logs
- Visit the Firebase community forums
- Review the integration code in `/src/integrations/firebase/`

---

Happy coding! 🚀
