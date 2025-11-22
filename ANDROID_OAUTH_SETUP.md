# Android OAuth Setup Guide

## Your Android Client ID
```
229949367486-jq4ntjuf9ejtis59cvmi2nbfdi6j61e9.apps.googleusercontent.com
```

## Steps to Configure Android OAuth Redirect URI

### 1. Get Your Android App SHA-1 Fingerprint
Run this command:
```powershell
cd d:\ANKITA\FProject\Aaralink\Aralink
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

This will show you a SHA-1 fingerprint like:
```
AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

### 2. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select project **"aralink-app-auth"**
3. Go to **APIs & Services** → **Credentials**
4. Find your Android OAuth 2.0 Client ID
5. Click on it to open details

### 3. Add Authorized Redirect URI
In the credentials details, add this under "Authorized redirect URIs":
```
com.aralink.app://oauth-redirect
```

Also add:
```
com.aralink.app:/oauth
```

### 4. Update Your app.json
Make sure your `app.json` has the correct package name:
```json
{
  "expo": {
    "android": {
      "package": "com.aralink.app"
    }
  }
}
```

### 5. Update .env.local
Verify your `.env.local` has:
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=229949367486-jq4ntjuf9ejtis59cvmi2nbfdi6j61e9.apps.googleusercontent.com
```

### 6. Test Login
After these steps:
1. Restart your app: `npm start`
2. Try clicking "Sign in with Google" on login screen
3. You should see Google's OAuth login dialog

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `invalid_request` | Redirect URI not whitelisted in Google Cloud Console |
| `invalid_client` | Client ID is incorrect or project doesn't exist |
| `access_blocked` | App isn't verified or needs consent screen setup |

## Setup Google Consent Screen (If Still Getting Errors)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select **"aralink-app-auth"** project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Choose **External** user type
5. Fill in app information:
   - App name: **Aralink**
   - User support email: your email
   - Developer contact: your email
6. Add scopes: `email`, `profile`
7. Save and Continue

This allows users to see your app and grant permissions.
