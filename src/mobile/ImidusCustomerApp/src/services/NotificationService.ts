import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import axios from 'axios';
import {ENV} from '../config/environment';

/**
 * Firebase Cloud Messaging notification service
 * Handles FCM token management, notification listeners, and backend registration
 */
class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Get the current device FCM token
   * Requests notification permission if needed
   */
  public async getFCMToken(): Promise<string> {
    const authStatus = await messaging().requestPermission();

    if (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    }

    throw new Error('Notification permission denied');
  }

  /**
   * Register FCM token with backend
   * Called after login and on app launch for authenticated users
   */
  public async registerTokenWithBackend(customerId: number): Promise<void> {
    try {
      const token = await this.getFCMToken();

      const response = await axios.post(
        `${ENV.API_BASE_URL}/notifications/register-token`,
        {
          token,
          platform: Platform.OS,
          customerId,
        },
      );

      console.log('FCM token registered with backend:', response.data);
    } catch (error) {
      console.error('Failed to register FCM token with backend:', error);
      throw error;
    }
  }

  /**
   * Set up token refresh listener
   * Re-registers token with backend when FCM token changes
   */
  public setupTokenRefreshListener(customerId: number): () => void {
    const unsubscribe = messaging().onTokenRefresh(async newToken => {
      console.log('FCM token refreshed:', newToken);
      try {
        await this.registerTokenWithBackend(customerId);
      } catch (error) {
        console.error('Failed to register refreshed token:', error);
      }
    });

    return unsubscribe;
  }

  /**
   * Set up foreground notification listener
   * Handles notifications when app is in foreground
   */
  public setupForegroundListener(): () => void {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Notification in foreground:', remoteMessage);

      // In production, you might want to show an in-app notification
      // For now, just log it
      if (remoteMessage.notification) {
        console.log('Title:', remoteMessage.notification.title);
        console.log('Body:', remoteMessage.notification.body);
      }
    });

    return unsubscribe;
  }

  /**
   * Request notification permission (iOS specific, but safe to call on Android)
   */
  public async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
}

export default NotificationService.getInstance();
