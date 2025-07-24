import CategoryPill from "@/components/CategoryPill";
import MenuItemCard from "@/components/MenuItemCard";
import colors from "@/constants/colors";
import typography from "@/constants/typography";
import { menuCategories } from "@/mocks/restaurants";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useRestaurantStore } from "@/store/restaurantStore";
import { Restaurant } from "@/types/restaurant";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  Animated, 
  Dimensions, 
  Linking, 
  Modal, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  TouchableOpacity as ModalTouchableOpacity 
} from "react-native";

// Conditionally import MapView to avoid web issues
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

// Only import on native platforms
if (Platform.OS !== "web") {
  try {
    const ReactNativeMaps = require("react-native-maps");
    MapView = ReactNativeMaps.default;
    Marker = ReactNativeMaps.Marker;
    PROVIDER_GOOGLE = ReactNativeMaps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn("react-native-maps could not be loaded", error);
  }
}

// Conditionally import Location to avoid web issues
let Location: any = null;
if (Platform.OS !== "web") {
  try {
    Location = require("expo-location");
  } catch (error) {
    console.warn("expo-location could not be loaded", error);
  }
}

export default function RestaurantDetailScreen() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { items } = useCartStore();
  const { fetchRestaurant, addReview } = useRestaurantStore();

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRestaurant(id);
        setRestaurant(data);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurant();
  }, [id, fetchRestaurant]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Calculate cart items count directly
  const cartItemCount = items.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    // Simulate loading restaurant data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Request location permission on native platforms
    if (Platform.OS !== "web" && Location) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          setLocationPermission(status === "granted");

          if (status === "granted") {
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        } catch (error) {
          console.warn("Error getting location:", error);
        }
      })();
    }

    return () => clearTimeout(timer);
  }, []);

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const getDirections = async () => {
    if (!restaurant?.location) return;

    // First, make sure the map is visible
    if (!showMap) {
      setShowMap(true);
      // Small delay to ensure the map is rendered before trying to open directions
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // If we're on web, open Google Maps in a new tab
    if (Platform.OS === 'web') {
      const { latitude, longitude } = restaurant.location;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
      return;
    }

    // On mobile, try to open in the native maps app
    const { latitude, longitude } = restaurant.location;
    const url = Platform.select({
      ios: `maps:${latitude},${longitude}?q=${encodeURIComponent(restaurant.address || restaurant.name || '')}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(restaurant.name || '')})`
    });

    if (url) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Error opening maps app:', error);
        // Fallback to web URL if native maps app fails
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        await Linking.openURL(webUrl);
      }
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'web') return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        Alert.alert(
          "Location Permission",
          "We need your location to show directions. Please enable location services in your settings.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.warn('Error requesting location permission:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.heading2}>Restaurant not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredMenu = restaurant.menu && (selectedCategory === "All"
    ? restaurant.menu
    : restaurant.menu.filter(item => item.category === selectedCategory));

  const formatOpeningHours = () => {
    try {
      if (!restaurant.openingHours || typeof restaurant.openingHours !== 'object') {
        return (
          <Text key="not-available" style={styles.hoursText}>
            Opening hours not available
          </Text>
        );
      }

      // Convert the openingHours object to an array of entries and sort them
      const sortedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      return sortedDays.map(day => {
        const hours = restaurant.openingHours?.[day];
        if (!hours || !hours.open || !hours.close) return null;

        return (
          <Text key={day} style={styles.hoursText}>
            {day}: {hours.open} - {hours.close}
          </Text>
        );
      }).filter(Boolean); // Remove any null entries
    } catch (error) {
      console.error('Error formatting opening hours:', error);
      return null;
    }
  };

  const renderPriceLevel = () => {
    const level = restaurant.priceLevel ? restaurant.priceLevel.length : 0;
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <MaterialIcons
          name="attach-money"
          key={index}
          size={14}
          color={index < level ? colors.secondary : colors.lightText}
        />
      ));
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const handleAddToCart = (menuItemId: string) => {
    // This function is implemented in the MenuItemCard component
  };

  const handleMenuItemPress = (menuItemId: string) => {
    router.push(`/menu-item/${restaurant.id}/${menuItemId}`);
  };

  const handleOpenReviewModal = () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "You need to be logged in to leave a review.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/login") }
        ]
      );
      return;
    }

    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!user) return;

    setIsSubmittingReview(true);

    // Simulate API call
    setTimeout(() => {
      try {
        addReview(restaurant.id, { 
          id: `review-${Date.now()}`,
          restaurantId: restaurant.id,
          userId: user.id,
          userName: user.name || 'Anonymous',
          rating: reviewRating, 
          text: reviewComment,
          createdAt: new Date().toISOString()
        });

        setIsSubmittingReview(false);
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment("");

        Alert.alert("Success", "Your review has been submitted. Thank you for your feedback!");
      } catch (error) {
        setIsSubmittingReview(false);
        Alert.alert("Error", "Failed to submit review. Please try again.");
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.animatedHeader,
        { opacity: headerOpacity }
      ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/cart")}
          >
            <Ionicons name="cart" size={24} color={colors.text} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: restaurant.coverImageUrl || restaurant.imageUrl }}
            style={styles.coverImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "transparent"]}
            style={styles.gradient}
          />
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartIconButton}
            onPress={() => router.push("/cart")}
          >
            <Ionicons name="cart" size={24} color={colors.white} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{restaurant.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>{restaurant.rating}</Text>
              <Text style={styles.reviewCount}>{restaurant.reviewCount} reviews</Text>
            </View>
            {restaurant.categories && (
              <View style={styles.categories}>
                {restaurant.categories.map(category => (
                  <Text key={category} style={styles.category}>{category}</Text>
                ))}
              </View>
            )}
            {restaurant.phone && (
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="phone" size={20} color={colors.gray[500]} />
                  <Text style={styles.metaText}>{restaurant.phone}</Text>
                </View>
              </View>
            )}
            {restaurant.website && (
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="globe" size={20} color={colors.gray[500]} />
                  <Text style={styles.metaText}>{restaurant.website}</Text>
                </View>
              </View>
            )}
            {restaurant.priceLevel && (
              <View style={styles.priceLevelContainer}>
                {renderPriceLevel()}
              </View>
            )}
            {restaurant.openingHours && (
              <View style={styles.hoursContainer}>
                <Text style={styles.hoursTitle}>Opening Hours</Text>
                <View style={styles.hoursList}>
                  {formatOpeningHours()}
                </View>
              </View>
            )}
            {user && (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={handleOpenReviewModal}
              >
                <Ionicons name="create" size={20} color={colors.primary} />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Menu</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {menuCategories.map((category) => (
                <CategoryPill
                  key={category}
                  title={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                />
              ))}
            </ScrollView>

            <View style={styles.menuItems}>
              {filteredMenu && filteredMenu.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onPress={() => handleMenuItemPress(item.id)}
                  onAddToCart={() => handleAddToCart(item.id)}
                />
              ))}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <Text style={styles.modalSubtitle}>{restaurant?.name}</Text>

            <View style={styles.ratingSelector}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Ionicons
                      name="star"
                      size={32}
                      color={star <= reviewRating ? colors.secondary : colors.gray[500]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review..."
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview || !reviewRating || !reviewComment.trim()}
            >
              <Text style={styles.submitButtonText}>
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowReviewModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    ...typography.heading1,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  rating: {
    ...typography.body,
    fontWeight: "600",
    marginLeft: 4,
  },
  reviewCount: {
    ...typography.bodySmall,
    color: colors.lightText,
    marginLeft: 4,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  category: {
    ...typography.bodySmall,
    color: colors.lightText,
    marginRight: 8,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    ...typography.bodySmall,
    marginLeft: 4,
  },
  priceLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  hoursContainer: {
    marginTop: 16,
  },
  hoursTitle: {
    ...typography.heading4,
    marginBottom: 12,
  },
  hoursList: {
    padding: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.primary + "15",
    borderRadius: 4,
  },
  writeReviewText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 4,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: 16,
  },
  categoriesScrollContent: {
    paddingBottom: 16,
  },
  menuItems: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.heading2,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.lightText,
    marginBottom: 20,
  },
  ratingSelector: {
    marginBottom: 20,
  },
  ratingLabel: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  reviewInput: {
    flex: 1,
    minHeight: 100,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    zIndex: 10,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.heading4,
    flex: 1,
    textAlign: "center",
  },
  imageContainer: {
    height: 250,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backIconButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartIconButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    marginTop: 16,
    color: colors.text,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  dayText: {
    ...typography.body,
    fontWeight: "500",
    width: 100,
  },

  // Removed duplicate style definitions
});
