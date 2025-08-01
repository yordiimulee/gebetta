import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import * as Location from 'expo-location';
import colors from '@/constants/colors';
import typography from '@/constants/typography';

// Restaurant interface based on backend schema
interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
    description?: string;
  };
  cuisineTypes: string[];
  ratingAverage: number;
  ratingQuantity: number;
  openHours: string;
  isDeliveryAvailable: boolean;
  isOpenNow: boolean;
  imageCover: string;
  deliveryRadiusMeters: number;
  description: string;
  license: string;
  managerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | string;
  reviewCount: number;
}

// Menu interface based on API response
interface Menu {
  _id: string;
  restaurantId: Restaurant;
  menuType: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Food item interface
interface Food {
  _id: string;
  foodName: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  menuId: string;
  ingredients?: string;
  instructions?: string;
  cookingTimeMinutes?: number;
  rating?: number;
  isFeatured?: boolean;
  categoryId?: {
    _id: string;
    categoryName: string;
  };
  status: string;
}

// Cart item interface
interface CartItem {
  food: Food;
  quantity: number;
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [foodItems, setFoodItems] = useState<{ [menuId: string]: Food[] }>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantitySelections, setQuantitySelections] = useState<{ [foodId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);

  const baseUrl = 'https://gebeta-delivery1.onrender.com';
  const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2EyNDE5ZmM2Y2IyYzk5MzIxMjQ3NSIsImlhdCI6MTc1MzA4MDI3NSwiZXhwIjoxNzYwODU2Mjc1fQ.vRs1UMH4h5L2WBZtJPOpfbJkYAAjXsIVHqYZ3_fIZAc';

  // Fetch restaurant details
  const fetchRestaurant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${baseUrl}/api/v1/restaurants/${id}`);
      const restaurantData = response.data.data.restaurant;
      if (!restaurantData) {
        throw new Error('No restaurant data found');
      }
      setRestaurant(restaurantData);
    } catch (err: any) {
      setError(err.message || 'Failed to load restaurant details');
      setRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch menus for the restaurant
  const fetchMenus = async () => {
    try {
      setIsLoadingMenus(true);
      setMenuError(null);
      const response = await axios.get(
        `${baseUrl}/api/v1/food-menus?restaurantId=${id}`
      );
      const menuData = response.data.data || [];
      setMenus(menuData);

      // Fetch food items for each menu
      const foodPromises = menuData.map((menu: Menu) =>
        axios.get(
          `${baseUrl}/api/v1/foods/by-menu/${menu._id}`
        ).catch(() => ({ data: { data: { foods: [] } } })) // Handle individual menu errors
      );
      const foodResponses = await Promise.all(foodPromises);
      const foodItemsMap: { [menuId: string]: Food[] } = {};
      foodResponses.forEach((res, index) => {
        foodItemsMap[menuData[index]._id] = res.data.data.foods || [];
      });
      setFoodItems(foodItemsMap);
    } catch (err: any) {
      setMenuError(err.message || 'Failed to load menus');
      setMenus([]);
      setFoodItems({});
    } finally {
      setIsLoadingMenus(false);
    }
  };

  // Update quantity for a food item
  const updateQuantity = (foodId: string, delta: number) => {
    setQuantitySelections((prev) => {
      const currentQuantity = prev[foodId] || 1;
      const newQuantity = Math.max(1, currentQuantity + delta);
      return { ...prev, [foodId]: newQuantity };
    });
  };

  // Add item to cart with selected quantity
  const addToCart = (food: Food) => {
    const quantity = quantitySelections[food._id] || 1;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.food._id === food._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.food._id === food._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { food, quantity }];
    });
    // Reset quantity selection after adding to cart
    setQuantitySelections((prev) => ({ ...prev, [food._id]: 1 }));
  };

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied. Please enable location services.');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const userLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      const orderBody = {
        orderItems: cart.map((item) => ({
          foodId: item.food._id,
          quantity: item.quantity,
        })),
        typeOfOrder: 'Delivery',
        location: userLocation,
      };

      const response = await axios.post(
        `${baseUrl}/api/v1/orders/place-order`,
        orderBody,
        {
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
        }
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Order placed successfully!');
        setCart([]); // Clear cart
        setQuantitySelections({}); // Reset quantities
      } else {
        throw new Error('Order placement failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchMenus();
    }
  }, [id]);

  // Handle back navigation
  const handleBackPress = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading restaurant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Restaurant not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              fetchRestaurant();
              fetchMenus();
            }}
            accessibilityLabel="Retry loading restaurant details"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityLabel="Go back to restaurant list"
          >
            <Text style={styles.backButtonText}>Back to Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total items in cart
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <Image
          source={{ uri: restaurant.imageCover }}
          style={styles.headerImage}
          resizeMode="cover"
        />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButtonAbsolute}
          onPress={handleBackPress}
          accessibilityLabel="Go back to restaurant list"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Cart Indicator */}
        <TouchableOpacity
          style={styles.cartIndicator}
          onPress={() => Alert.alert('Cart', `You have ${totalCartItems} items in your cart.`)}
          accessibilityLabel="View cart"
        >
          <FontAwesome name="shopping-cart" size={20} color={colors.white} />
          {totalCartItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisineTypes}>
            {restaurant.cuisineTypes.join(' • ')}
          </Text>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={20} color={colors.warning} />
            <Text style={styles.ratingText}>
              {restaurant.ratingAverage.toFixed(1)} ({restaurant.ratingQuantity}{' '}
              reviews)
            </Text>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <FontAwesome name="map-marker" size={20} color={colors.primary} style={styles.icon} />
            <Text style={styles.detailText}>{restaurant.location.address}</Text>
          </View>

          {/* Open Hours */}
          <View style={styles.detailRow}>
            <FontAwesome name="clock-o" size={20} color={colors.primary} style={styles.icon} />
            <Text style={styles.detailText}>
              {restaurant.openHours}{' '}
              <Text style={styles.statusText}>
                ({restaurant.isOpenNow ? 'Open Now' : 'Closed'})
              </Text>
            </Text>
          </View>

          {/* Delivery Info */}
          <View style={styles.detailRow}>
            <FontAwesome name="truck" size={20} color={colors.primary} style={styles.icon} />
            <Text style={styles.detailText}>
              {restaurant.isDeliveryAvailable
                ? `Delivery available (${Math.ceil(restaurant.deliveryRadiusMeters / 100)}-${
                    Math.ceil(restaurant.deliveryRadiusMeters / 100) + 15
                  } min)`
                : 'Delivery not available'}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{restaurant.description}</Text>
          </View>

          {/* Additional Info */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text style={styles.detailText}>
              License: {restaurant.license}
            </Text>
            <Text style={styles.detailText}>
              Delivery Radius: {(restaurant.deliveryRadiusMeters / 1000).toFixed(1)} km
            </Text>
            {typeof restaurant.managerId === 'object' && restaurant.managerId && (
              <Text style={styles.detailText}>
                Managed by: {restaurant.managerId.firstName}{' '}
                {restaurant.managerId.lastName}
              </Text>
            )}
          </View>

          {/* Menus */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Menu</Text>
            {isLoadingMenus ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading menus...</Text>
              </View>
            ) : menuError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{menuError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchMenus}
                  accessibilityLabel="Retry loading menus"
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : menus.length === 0 ? (
              <Text style={styles.emptyText}>No menus available</Text>
            ) : (
              menus.map((menu) => (
                <View key={menu._id} style={styles.menuContainer}>
                  <Text style={styles.menuTitle}>{menu.menuType}</Text>
                  {foodItems[menu._id]?.length > 0 ? (
                    foodItems[menu._id].map((food) => (
                      <View key={food._id} style={styles.foodItem}>
                        <View style={styles.foodInfo}>
                          <Text style={styles.foodName}>{food.foodName}</Text>
                          {food.ingredients && (
                            <Text style={styles.foodDescription}>
                              {food.ingredients}
                            </Text>
                          )}
                          <Text style={styles.foodPrice}>
                            ${food.price.toFixed(2)}
                          </Text>
                          {food.status !== 'Available' && (
                            <Text style={styles.foodNotAvailable}>
                              Not available
                            </Text>
                          )}
                        </View>
                        {food.image && (
                          <Image
                            source={{ uri: food.image }}
                            style={styles.foodImage}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.quantityContainer}>
                          {food.status === 'Available' && (
                            <View style={styles.quantitySelector}>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(food._id, -1)}
                                accessibilityLabel={`Decrease quantity of ${food.foodName}`}
                              >
                                <Text style={styles.quantityButtonText}>-</Text>
                              </TouchableOpacity>
                              <Text style={styles.quantityText}>
                                {quantitySelections[food._id] || 1}
                              </Text>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(food._id, 1)}
                                accessibilityLabel={`Increase quantity of ${food.foodName}`}
                              >
                                <Text style={styles.quantityButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          <TouchableOpacity
                            style={[
                              styles.addToCartButton,
                              food.status !== 'Available' && styles.disabledButton,
                            ]}
                            onPress={() => food.status === 'Available' && addToCart(food)}
                            disabled={food.status !== 'Available'}
                            accessibilityLabel={`Add ${food.foodName} to cart`}
                          >
                            <Text style={styles.addToCartText}>Add to Cart</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No food items available</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Place Order Button */}
          {cart.length > 0 && (
            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                isPlacingOrder && styles.disabledButton,
              ]}
              onPress={placeOrder}
              disabled={isPlacingOrder}
              accessibilityLabel="Place order"
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.placeOrderText}>
                  Place Order ({totalCartItems} items)
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  cartIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cartBadgeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  restaurantName: {
    ...typography.h4,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cuisineTypes: {
    ...typography.body,
    color: colors.lightText,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    ...typography.body,
    color: colors.text,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  detailText: {
    ...typography.body,
    color: colors.text,
  },
  statusText: {
    ...typography.body,
    color: colors.primary,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  descriptionText: {
    ...typography.body,
    color: colors.lightText,
    lineHeight: 24,
  },
  menuContainer: {
    marginBottom: 16,
  },
  menuTitle: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  foodItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  foodDescription: {
    ...typography.small,
    color: colors.lightText,
    marginBottom: 4,
  },
  foodPrice: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  foodNotAvailable: {
    ...typography.small,
    color: colors.error,
    marginTop: 4,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 12,
  },
  quantityContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    ...typography.body,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    ...typography.body,
    color: colors.text,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disabledButton: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  addToCartText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  placeOrderText: {
    ...typography.button,
    color: colors.white,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightText,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightText,
    marginTop: 8,
  },
});