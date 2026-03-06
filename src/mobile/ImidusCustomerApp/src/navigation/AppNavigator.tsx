import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import messaging from '@react-native-firebase/messaging';
import SplashScreen from '../screens/SplashScreen';
import CartScreen from '../screens/CartScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MenuScreen from '../screens/MenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import { RootState, AppDispatch } from '../store';
import { loadStoredAuth } from '../store/authSlice';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRef<any>(null);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [initialRouteParams, setInitialRouteParams] = useState<any>(null);

  // Load stored auth on app launch
  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  // Set up FCM notification handlers for deep linking
  useEffect(() => {
    // NOTE: Firebase wrapped in try-catch to make optional during development
    try {
      // Handle notification when app is in background/foreground and user taps it
      const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
        remoteMessage => {
          console.log('Notification caused app to open from background:', remoteMessage);
          const { screen, orderId } = remoteMessage.data || {};
          if (screen === 'OrderTracking' && orderId && navigationRef.current) {
            navigationRef.current.navigate('OrderTracking', { orderId: parseInt(orderId, 10) });
          }
        }
      );

      // Check if app was opened from a notification while it was quit
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('Notification caused app to open from quit state:', remoteMessage);
            const { screen, orderId } = remoteMessage.data || {};
            if (screen === 'OrderTracking' && orderId) {
              setInitialRoute('OrderTracking');
              setInitialRouteParams({ orderId: parseInt(orderId, 10) });
            }
          }
        });

      return unsubscribeOnNotificationOpenedApp;
    } catch (error) {
      console.log('Firebase not configured (dev mode):', error);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  // Navigate to initial route after navigation is ready
  useEffect(() => {
    if (initialRoute && initialRouteParams && navigationRef.current) {
      navigationRef.current.navigate(initialRoute, initialRouteParams);
      setInitialRoute(null);
      setInitialRouteParams(null);
    }
  }, [initialRoute, initialRouteParams, isAuthenticated]);

  // Show splash screen during auth check
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Public routes (unauthenticated users)
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Protected routes (authenticated users)
          <>
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
