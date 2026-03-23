/**
 * Web-Specific App Navigator
 * Auto-resolved by Vite (.web.tsx extension priority)
 * Shows DesignSystemScreen first for design preview
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import DesignSystemScreen from '../screens/DesignSystemScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import MenuScreen from '../screens/MenuScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="DesignSystem">
        {/* Design System Showcase (web-only landing) */}
        <Stack.Screen name="DesignSystem" component={DesignSystemScreen} />

        {/* All App Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
