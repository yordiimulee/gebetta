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
  RefreshControl,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { 
  ChevronLeft, 
  MapPin, 
  Clock
} from 'lucide-react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import colors from '../../constants/colors';
import typography from '../../constants/typography';
import { useCartStore } from '../../store/cartStore';

const { width } = Dimensions.get('window');

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
  const [quantitySelections, setQuantitySelections] = useState<{ [foodId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);

  
  // Use global cart store
  const { addToCart, getCartItems } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baseUrl = 'https://gebeta-delivery1.onrender.com';
  const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2EyNDE5ZmM2Y2IyYzk5MzIxMjQ3NSIsImlhdCI6MTc1MzA4MDI3NSwiZXhwIjoxNzYwODU1Njc1fQ.vRs1UMH4h5L2WBZtJPOpfbJkYAAjXsIVHqYZ3_fIZAc';

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

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchRestaurant(), fetchMenus()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
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

  // Generate fallback description and ingredients based on food name
  const getFoodDescription = (food: Food) => {
    if (food.description) {
      return food.description;
    }
    
    const foodName = food.foodName.toLowerCase();
    
    // Ethiopian dishes
    if (foodName.includes('doro') || foodName.includes('chicken')) {
      return 'Traditional Ethiopian chicken stew with berbere spice, served with injera bread';
    }
    if (foodName.includes('tibs') || foodName.includes('beef')) {
      return 'Sautéed beef with onions, peppers, and Ethiopian spices';
    }
    if (foodName.includes('injera')) {
      return 'Traditional sourdough flatbread made from teff flour';
    }
    if (foodName.includes('kitfo')) {
      return 'Minced raw beef seasoned with mitmita spice and clarified butter';
    }
    if (foodName.includes('shiro')) {
      return 'Spiced chickpea flour stew with onions and garlic';
    }
    if (foodName.includes('gomen')) {
      return 'Sautéed collard greens with onions and spices';
    }
    
    // Italian dishes
    if (foodName.includes('pizza')) {
      return 'Wood-fired pizza with fresh ingredients and authentic Italian flavors';
    }
    if (foodName.includes('pasta')) {
      return 'Fresh pasta with rich sauce and premium ingredients';
    }
    if (foodName.includes('lasagna')) {
      return 'Layered pasta with meat sauce, cheese, and béchamel';
    }
    
    // Fast food
    if (foodName.includes('burger')) {
      return 'Juicy beef patty with fresh vegetables and special sauce';
    }
    if (foodName.includes('fries')) {
      return 'Crispy golden fries seasoned to perfection';
    }
    if (foodName.includes('chicken')) {
      return 'Tender chicken prepared with signature spices';
    }
    
    // General fallback
    return 'Delicious dish prepared with fresh, quality ingredients';
  };

  const getFoodIngredients = (food: Food) => {
    if (food.ingredients) {
      return food.ingredients;
    }
    
    const foodName = food.foodName.toLowerCase();
    
    // Ethiopian dishes
    if (foodName.includes('doro') || foodName.includes('chicken')) {
      return 'Chicken, Berbere spice, Onions, Garlic, Ginger, Clarified butter';
    }
    if (foodName.includes('tibs') || foodName.includes('beef')) {
      return 'Beef, Onions, Peppers, Ethiopian spices, Clarified butter';
    }
    if (foodName.includes('injera')) {
      return 'Teff flour, Water, Salt';
    }
    if (foodName.includes('kitfo')) {
      return 'Raw beef, Mitmita spice, Clarified butter, Cottage cheese';
    }
    if (foodName.includes('shiro')) {
      return 'Chickpea flour, Onions, Garlic, Berbere spice, Oil';
    }
    if (foodName.includes('gomen')) {
      return 'Collard greens, Onions, Garlic, Ginger, Oil';
    }
    
    // Italian dishes
    if (foodName.includes('pizza')) {
      return 'Dough, Tomato sauce, Mozzarella, Fresh basil, Olive oil';
    }
    if (foodName.includes('pasta')) {
      return 'Fresh pasta, Tomato sauce, Parmesan, Basil, Olive oil';
    }
    if (foodName.includes('lasagna')) {
      return 'Pasta sheets, Ground beef, Ricotta, Mozzarella, Tomato sauce';
    }
    
    // Fast food
    if (foodName.includes('burger')) {
      return 'Beef patty, Lettuce, Tomato, Onion, Special sauce, Bun';
    }
    if (foodName.includes('fries')) {
      return 'Potatoes, Salt, Oil';
    }
    if (foodName.includes('chicken')) {
      return 'Chicken, Flour, Spices, Oil';
    }
    
    // General fallback
    return 'Fresh ingredients, Spices, Herbs';
  };

  // Add item to cart with selected quantity
  const handleAddToCart = (food: Food) => {
    const quantity = quantitySelections[food._id] || 1;
    
    // Use global cart store with proper data structure
    addToCart(restaurant?._id || '', food._id, quantity, undefined, {
      name: food.foodName,
      price: food.price,
    });
    
    // Reset quantity selection after adding to cart
    setQuantitySelections((prev) => ({ ...prev, [food._id]: 1 }));
    
    Alert.alert(
      "Added to Cart",
      `${quantity} ${food.foodName} added to your cart.`,
      [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "View Cart",
          onPress: () => router.push("/cart"),
        },
      ]
    );
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
  const totalCartItems = getCartItems().reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Image with Gradient */}
        <View style={styles.headerImageContainer}>
          <ExpoImage
            source={{ uri: restaurant.imageCover }}
            style={styles.headerImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.headerGradient}
          />
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleBackPress}
              accessibilityLabel="Go back to restaurant list"
            >
              <ChevronLeft size={24} color={colors.white} />
            </TouchableOpacity>
            
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => Alert.alert('Share', 'Share this restaurant')}
                accessibilityLabel="Share restaurant"
              >
                <FontAwesome name="share" size={20} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => Alert.alert('Favorite', 'Added to favorites')}
                accessibilityLabel="Add to favorites"
              >
                <FontAwesome name="heart" size={20} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.headerButton, styles.cartButton]}
                onPress={() => router.push('/cart')}
                accessibilityLabel="View cart"
              >
                <FontAwesome name="shopping-cart" size={20} color={colors.white} />
                {totalCartItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          {/* Restaurant Header */}
          <View style={styles.restaurantHeader}>
            <View style={styles.restaurantTitleSection}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.cuisineTags}>
                {restaurant.cuisineTypes.map((cuisine, index) => (
                  <View key={index} style={styles.cuisineTag}>
                    <Text style={styles.cuisineTagText}>{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: restaurant.isOpenNow ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusBadgeText}>
                {restaurant.isOpenNow ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={20} color={colors.warning} />
              <Text style={styles.ratingText}>
                {restaurant.ratingAverage.toFixed(1)}
              </Text>
              <Text style={styles.ratingCount}>
                ({restaurant.ratingQuantity} reviews)
              </Text>
            </View>
          </View>

          {/* Restaurant Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Location */}
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailText} numberOfLines={2}>
                  {restaurant.location.address}
                </Text>
              </View>
            </View>

            {/* Open Hours */}
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <Clock size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Hours</Text>
                <Text style={styles.detailText}>{restaurant.openHours}</Text>
              </View>
            </View>

            {/* Delivery Info */}
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <FontAwesome name="truck" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Delivery</Text>
                <Text style={styles.detailText}>
                  {restaurant.isDeliveryAvailable
                    ? `${Math.ceil(restaurant.deliveryRadiusMeters / 100)}-${Math.ceil(restaurant.deliveryRadiusMeters / 100) + 15} min`
                    : 'Not available'}
                </Text>
              </View>
            </View>

            {/* Delivery Radius */}
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <FontAwesome name="map" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Radius</Text>
                <Text style={styles.detailText}>
                  {(restaurant.deliveryRadiusMeters / 1000).toFixed(1)} km
                </Text>
              </View>
            </View>
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
                        <TouchableOpacity 
                          key={food._id} 
                          style={styles.foodItem}
                          onPress={() => router.push(`/menu-item/${restaurant?._id}/${food._id}`)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.foodImageContainer}>
                            {food.image ? (
                              <ExpoImage
                                source={{ uri: food.image }}
                                style={styles.foodImage}
                                contentFit="cover"
                                transition={200}
                              />
                            ) : (
                              <View style={styles.foodImagePlaceholder}>
                                <Text style={styles.foodImagePlaceholderText}>🍽️</Text>
                              </View>
                            )}
                            {food.status !== 'Available' && (
                              <View style={styles.unavailableOverlay}>
                                <Text style={styles.unavailableText}>Unavailable</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.foodContent}>
                            <View style={styles.foodHeader}>
                              <Text style={styles.foodName} numberOfLines={1}>{food.foodName}</Text>
                              <Text style={styles.foodPrice}>
                                ${food.price.toFixed(2)}
                              </Text>
                            </View>
                            
                            <Text style={styles.foodDescription} numberOfLines={2}>
                              {getFoodDescription(food)}
                            </Text>
                            
                            <Text style={styles.foodIngredients} numberOfLines={1}>
                              {getFoodIngredients(food)}
                            </Text>
                            
                            {food.status === 'Available' && (
                              <View style={styles.foodActions}>
                                <View style={styles.quantitySelector}>
                                  <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(food._id, -1);
                                    }}
                                    accessibilityLabel={`Decrease quantity of ${food.foodName}`}
                                  >
                                    <FontAwesome name="minus" size={14} color={colors.text} />
                                  </TouchableOpacity>
                                  <Text style={styles.quantityText}>
                                    {quantitySelections[food._id] || 1}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(food._id, 1);
                                    }}
                                    accessibilityLabel={`Increase quantity of ${food.foodName}`}
                                  >
                                    <FontAwesome name="plus" size={14} color={colors.text} />
                                  </TouchableOpacity>
                                </View>
                                
                                <TouchableOpacity
                                  style={styles.addToCartButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(food);
                                  }}
                                  accessibilityLabel={`Add ${food.foodName} to cart`}
                                >
                                  <FontAwesome name="shopping-cart" size={14} color={colors.white} />
                                  <Text style={styles.addToCartText}>Add</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No food items available</Text>
                  )}
                </View>
              ))
            )}
          </View>


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
  headerImageContainer: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerActions: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.warning,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: colors.white,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 250,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantTitleSection: {
    flex: 1,
  },
  restaurantName: {
    ...typography.heading1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cuisineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  cuisineTagText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    ...typography.heading3,
    color: colors.text,
    fontWeight: '600',
  },
  ratingCount: {
    ...typography.body,
    color: colors.lightText,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.lightText,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
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
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 120,
  },
  foodImageContainer: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodImagePlaceholderText: {
    fontSize: 32,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  foodContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  foodName: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  foodPrice: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
  },
  foodDescription: {
    ...typography.caption,
    color: colors.lightText,
    lineHeight: 16,
    marginBottom: 4,
  },
  foodIngredients: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  foodActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  quantityText: {
    ...typography.caption,
    color: colors.text,
    marginHorizontal: 8,
    fontWeight: '600',
    minWidth: 16,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addToCartText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
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
  backButtonText: {
    ...typography.button,
    color: colors.text,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightText,
    marginTop: 8,
  },
});