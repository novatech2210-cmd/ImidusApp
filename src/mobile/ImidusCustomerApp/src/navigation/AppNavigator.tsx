import messaging from '@react-native-firebase/messaging';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import MenuScreen from '../screens/MenuScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';
import {AppDispatch, RootState} from '../store';
import {loadStoredAuth} from '../store/authSlice';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {isAuthenticated, isLoading} = useSelector(
    (state: RootState) => state.auth,
  );
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
      const unsubscribeOnNotificationOpenedApp =
        messaging().onNotificationOpenedApp(remoteMessage => {
          console.log(
            'Notification caused app to open from background:',
            remoteMessage,
          );
          const {screen, orderId} = remoteMessage.data || {};
          if (screen === 'OrderTracking' && orderId && navigationRef.current) {
            navigationRef.current.navigate('OrderTracking', {
              orderId: parseInt(orderId as string, 10),
            });
          }
        });

      // Check if app was opened from a notification while it was quit
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log(
              'Notification caused app to open from quit state:',
              remoteMessage,
            );
            const {screen, orderId} = remoteMessage.data || {};
            if (screen === 'OrderTracking' && orderId) {
              setInitialRoute('OrderTracking');
              setInitialRouteParams({orderId: parseInt(orderId as string, 10)});
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
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <>
            {/* Unauthenticated: start at Login, can browse menu as guest */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
          </>
        ) : (
          <>
            {/* Authenticated: full access */}
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen
              name="OrderConfirmation"
              component={OrderConfirmationScreen}
            />
            <Stack.Screen
              name="OrderTracking"
              component={OrderTrackingScreen}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
