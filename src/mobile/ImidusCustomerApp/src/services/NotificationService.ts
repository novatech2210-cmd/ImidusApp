/**
 * Mock Notification Service for local development and verification.
 * In a production environment, this would be replaced with @react-native-firebase/messaging or similar.
 */
class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: any) => void)[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Simulate receiving a push notification.
   */
  public simulateIncomingNotification(title: string, body: string, data?: any) {
    console.log('🔔 [MOCK NOTIFICATION RECEIVED]', {title, body, data});
    this.listeners.forEach(listener => listener({title, body, data}));
  }

  /**
   * Register a listener for incoming notifications.
   */
  public addNotificationListener(callback: (notification: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Get the current device FCM token (mocked).
   */
  public async getFCMToken(): Promise<string> {
    return 'mock-fcm-token-123456';
  }
}

export default NotificationService.getInstance();
