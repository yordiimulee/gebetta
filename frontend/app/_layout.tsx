import { useAuthStore } from "@/store/useAuthStore";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import colors from "@/constants/colors";

export default function RootLayout() {
  const { isAuthenticated, isLoading, initializeAuth, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Debug log auth state changes
  useEffect(() => {
    console.log('RootLayout auth state changed:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      isInitialized
    });
  }, [isAuthenticated, isLoading, user, isInitialized]);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('RootLayout: Initializing auth...');
    const initAuth = async () => {
      try {
        await initializeAuth();
        console.log('RootLayout: Auth initialization complete');
      } catch (error) {
        console.error('RootLayout: Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initAuth();
  }, [initializeAuth]);

  // Show loading indicator while initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth routes
        <>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </>
      ) : (
        // Authenticated routes
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(restaurant)" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]" options={{ headerShown: false, title: "Recipe Details" }} />
          <Stack.Screen name="restaurant/[id]" options={{ headerShown: false, title: "Restaurant" }} />
          <Stack.Screen name="menu-item/[restaurantId]/[itemId]" options={{ headerShown: false, title: "Menu Item" }} />
          <Stack.Screen name="checkout" options={{ headerShown: false, title: "Checkout" }} />
          <Stack.Screen name="order/[id]" options={{ headerShown: false, title: "Order Details" }} />
          <Stack.Screen name="delivery-tracking/[id]" options={{ headerShown: false, title: "Delivery Tracking" }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false, title: "Edit Profile" }} />
          <Stack.Screen name="profile/addresses/index" options={{ headerShown: false, title: "My Addresses" }} />
          <Stack.Screen name="profile/addresses/edit/[id]" options={{ headerShown: false, title: "Edit Address" }} />
          <Stack.Screen name="profile/payment/index" options={{ headerShown: false, title: "Payment Methods" }} />
          <Stack.Screen name="profile/orders" options={{ headerShown: false, title: "My Orders" }} />
          <Stack.Screen name="settings" options={{ headerShown: false, title: "Settings" }} />
          <Stack.Screen name="create-recipe" options={{ headerShown: false, title: "Create Recipe" }} />
          <Stack.Screen name="edit-recipe/[id]" options={{ headerShown: false, title: "Edit Recipe" }} />
        </>
      )}
    </Stack>
  );
}
