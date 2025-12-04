import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  exchangeCodeAsync,
  makeRedirectUri
} from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Configure web browser
WebBrowser.maybeCompleteAuthSession();

// Get OAuth configuration from app.json extra or environment variables
const getConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  return {
    googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || extra.googleClientIdAndroid,
    googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || extra.googleClientIdIos,
    appleClientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || extra.appleClientId,
    facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || extra.facebookAppId,
  };
};

const config = getConfig();

// OAuth Client IDs
const GOOGLE_CLIENT_ID_ANDROID = config.googleClientIdAndroid || null;
const GOOGLE_CLIENT_ID_IOS = config.googleClientIdIos || null;
const APPLE_CLIENT_ID = config.appleClientId || null;
const FACEBOOK_APP_ID = config.facebookAppId || null;

// Get the appropriate Google Client ID based on platform
const getGoogleClientId = () => {
  if (Platform.OS === 'ios') {
    return GOOGLE_CLIENT_ID_IOS;
  } else if (Platform.OS === 'android') {
    return GOOGLE_CLIENT_ID_ANDROID;
  } else {
    // For web, use Android or iOS ID as fallback
    return GOOGLE_CLIENT_ID_ANDROID || GOOGLE_CLIENT_ID_IOS;
  }
};

// OAuth Discovery Documents
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://accounts.google.com/o/oauth2/revoke',
};

const appleDiscovery = {
  authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
  tokenEndpoint: 'https://appleid.apple.com/auth/token',
  revocationEndpoint: 'https://appleid.apple.com/auth/revoke',
};

const facebookDiscovery = {
  authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v12.0/oauth/access_token',
};

// Google OAuth - Using only expo-auth-session
export const googleAuth = {
  discovery: googleDiscovery,

  // Get configuration for components using useAuthRequest hook
  getConfig() {
    return {
      clientId: getGoogleClientId(),
      redirectUri: makeRedirectUri({
        scheme: 'aralink',
        path: 'oauth-redirect',
      }),
      discovery: googleDiscovery,
      scopes: ['openid', 'profile', 'email'],
    };
  },

  // Handle successful authentication with auth code
  async exchangeCodeForToken(code: string) {
    try {
      const clientId = getGoogleClientId();
      const redirectUri = makeRedirectUri({
        scheme: 'aralink',
        path: 'oauth-redirect',
      });

      if (!clientId) {
        return {
          success: false,
          error: 'Google OAuth is not properly configured',
        };
      }

      const token = await exchangeCodeAsync(
        {
          clientId,
          code,
          redirectUri,
        },
        googleDiscovery
      );

      // Fetch user info using access token
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      });

      const user = await response.json();

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        'googleUser',
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          provider: 'google',
          accessToken: token.accessToken,
        })
      );

      console.log('✅ Google Sign In successful');

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          provider: 'google',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token exchange failed';
      console.error('Google Token Exchange Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async signOut() {
    try {
      await AsyncStorage.removeItem('googleUser');
      console.log('✅ Google Sign Out successful');
      return { success: true };
    } catch (error) {
      console.error('Google Sign Out Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  },

  async getCurrentUser() {
    try {
      const storedUser = await AsyncStorage.getItem('googleUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  },
};

// Apple OAuth
export const appleAuth = {
  discovery: appleDiscovery,

  getConfig() {
    return {
      clientId: APPLE_CLIENT_ID,
      redirectUri: makeRedirectUri({
        scheme: 'com.aralink.app',
      }),
      discovery: appleDiscovery,
      scopes: ['openid', 'email', 'name'],
    };
  },

  async exchangeCodeForToken(code: string) {
    try {
      if (!APPLE_CLIENT_ID) {
        return {
          success: false,
          error: 'Apple OAuth is not configured',
        };
      }

      const redirectUri = makeRedirectUri({
        scheme: 'com.aralink.app',
      });

      const token = await exchangeCodeAsync(
        {
          clientId: APPLE_CLIENT_ID,
          code,
          redirectUri,
        },
        appleDiscovery
      );

      // Decode JWT token to get user info
      const decoded = decodeJWT(token.idToken || '');

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        'appleUser',
        JSON.stringify({
          id: decoded.sub,
          email: decoded.email,
          provider: 'apple',
          accessToken: token.accessToken,
        })
      );

      console.log('✅ Apple Sign In successful');

      return {
        success: true,
        user: {
          id: decoded.sub,
          email: decoded.email,
          provider: 'apple',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Apple authentication failed';
      console.error('Apple Auth Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async signOut() {
    try {
      await AsyncStorage.removeItem('appleUser');
      console.log('✅ Apple Sign Out successful');
      return { success: true };
    } catch (error) {
      console.error('Apple Sign Out Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  },

  async getCurrentUser() {
    try {
      const storedUser = await AsyncStorage.getItem('appleUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error getting current Apple user:', error);
      return null;
    }
  },
};

// Facebook OAuth
export const facebookAuth = {
  discovery: facebookDiscovery,

  getConfig() {
    return {
      clientId: FACEBOOK_APP_ID,
      redirectUri: makeRedirectUri({
        scheme: 'com.aralink.app',
      }),
      discovery: facebookDiscovery,
      scopes: ['public_profile', 'email'],
    };
  },

  async exchangeCodeForToken(code: string) {
    try {
      if (!FACEBOOK_APP_ID) {
        return {
          success: false,
          error: 'Facebook OAuth is not configured',
        };
      }

      const redirectUri = makeRedirectUri({
        scheme: 'com.aralink.app',
      });

      const token = await exchangeCodeAsync(
        {
          clientId: FACEBOOK_APP_ID,
          code,
          redirectUri,
        },
        facebookDiscovery
      );

      const accessToken = token.accessToken;
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${accessToken}`
      );

      const user = await response.json();

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        'facebookUser',
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture?.data?.url,
          provider: 'facebook',
          accessToken,
        })
      );

      console.log('✅ Facebook Sign In successful');

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture?.data?.url,
          provider: 'facebook',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Facebook authentication failed';
      console.error('Facebook Auth Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async signOut() {
    try {
      await AsyncStorage.removeItem('facebookUser');
      console.log('✅ Facebook Sign Out successful');
      return { success: true };
    } catch (error) {
      console.error('Facebook Sign Out Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  },

  async getCurrentUser() {
    try {
      const storedUser = await AsyncStorage.getItem('facebookUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error getting current Facebook user:', error);
      return null;
    }
  },
};

// Helper function to decode JWT
function decodeJWT(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }

  const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
  return JSON.parse(decoded);
}

// Utility function to get all stored users
export const getStoredOAuthUser = async () => {
  try {
    const googleUser = await AsyncStorage.getItem('googleUser');
    const appleUser = await AsyncStorage.getItem('appleUser');
    const facebookUser = await AsyncStorage.getItem('facebookUser');

    return {
      google: googleUser ? JSON.parse(googleUser) : null,
      apple: appleUser ? JSON.parse(appleUser) : null,
      facebook: facebookUser ? JSON.parse(facebookUser) : null,
    };
  } catch (error) {
    console.error('Error retrieving stored OAuth users:', error);
    return {
      google: null,
      apple: null,
      facebook: null,
    };
  }
};

// Logout all OAuth providers
export const logoutAll = async () => {
  try {
    await googleAuth.signOut();
    await appleAuth.signOut();
    await facebookAuth.signOut();
    console.log('✅ All OAuth providers logged out');
    return { success: true };
  } catch (error) {
    console.error('Error logging out all providers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
};
