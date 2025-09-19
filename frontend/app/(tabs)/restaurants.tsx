import CategoryPill from "@/components/CategoryPill";
import RestaurantCard from "@/components/RestaurantCard";
import colors from "@/constants/colors";
import typography from "@/constants/typography";

import { useCartStore } from "@/store/cartStore";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ChevronDown, MapPin, Search, X, ShoppingBag, Settings } from "lucide-react-native";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Modal, Switch, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// Custom slider implementation
import { PanResponder } from 'react-native';

interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const CustomSlider: React.FC<SliderProps> = ({
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.1,
  onValueChange,
  minimumTrackTintColor = '#0000FF',
  maximumTrackTintColor = '#00000022',
  thumbTintColor = '#0000FF',
  style,
  disabled = false,
  accessibilityLabel,
}) => {
  const sliderWidth = 200; // Default width
  const thumbSize = 20;
  
  const getSliderPosition = (v: number) => {
    const range = maximumValue - minimumValue;
    const position = ((v - minimumValue) / range) * sliderWidth;
    return Math.max(0, Math.min(position, sliderWidth));
  };
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderMove: (_, gestureState) => {
      if (disabled) return;
      
      const { dx } = gestureState;
      const range = maximumValue - minimumValue;
      const steps = range / step;
      const stepInPixels = sliderWidth / steps;
      const newValue = value + (dx / stepInPixels) * step;
      
      const clampedValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
      const steppedValue = Math.round(clampedValue / step) * step;
      
      onValueChange(steppedValue);
    },
  });
  
  const trackPosition = getSliderPosition(value);
  
  return (
    <View style={[styles.sliderContainer, style]}>
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]}>
        <View 
          style={[
            styles.trackActive, 
            { 
              width: trackPosition,
              backgroundColor: minimumTrackTintColor,
            },
          ]} 
        />
      </View>
      <View 
        style={[
          styles.thumb,
          { 
            left: trackPosition - thumbSize / 2,
            backgroundColor: thumbTintColor,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        {...panResponder.panHandlers}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: minimumValue,
          max: maximumValue,
          now: value,
        }}
      />
    </View>
  );
};

const Slider = CustomSlider;
import axios from "axios";

// Define the OpeningHours type to be more flexible
type OpeningHours = {
  [key: string]: {
    open: string;
    close: string;
  };
};

// Parse openHours string (e.g., "9:00 AM - 9:00 PM") into OpeningHours object
const parseOpeningHours = (openHours: string): OpeningHours => {
  const [open, close] = openHours.split(" - ").map(time => time.trim());
  return {
    default: { open, close },
  };
};

// Import the main Restaurant interface
import { Restaurant as AppRestaurant } from "@/types/restaurant";

// Define the API response format for restaurant location
interface ApiRestaurantLocation {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}

// Define the API response format for restaurant
interface ApiRestaurant {
  _id: string;
  name: string;
  slug: string;
  location: ApiRestaurantLocation;
  description: string;
  deliveryRadiusMeters: number;
  license: string;
  managerId: string | { _id: string } | string;
  cuisineTypes: string[];
  imageCover: string;
  ratingAverage: number;
  ratingQuantity: number;
  openHours: string;
  isDeliveryAvailable: boolean;
  isOpenNow: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  reviews?: any[];
  shortDescription?: string;
  reviewCount?: number;
}

// Convert API restaurant to app's Restaurant type
function toAppRestaurant(apiRestaurant: ApiRestaurant): AppRestaurant {
  const location = apiRestaurant.location;
  const coordinates = location?.coordinates || [0, 0];
  
  return {
    id: apiRestaurant._id,
    _id: apiRestaurant._id,
    name: apiRestaurant.name,
    slug: apiRestaurant.slug || apiRestaurant.name.toLowerCase().replace(/\s+/g, '-'),
    ownerId: typeof apiRestaurant.managerId === 'object' 
      ? (apiRestaurant.managerId?._id || '') 
      : (apiRestaurant.managerId || ''),
    imageUrl: apiRestaurant.imageCover || '',
    imageCover: apiRestaurant.imageCover || '',
    address: location?.address || 'Address not available',
    cuisine: apiRestaurant.cuisineTypes?.[0] || 'Other',
    cuisineTypes: apiRestaurant.cuisineTypes || [],
    priceLevel: '$$', // Default price level
    rating: apiRestaurant.ratingAverage || 0,
    ratingAverage: apiRestaurant.ratingAverage || 0,
    ratingQuantity: apiRestaurant.ratingQuantity || 0,
    isOpen: !!apiRestaurant.isOpenNow,
    isOpenNow: !!apiRestaurant.isOpenNow,
    isDeliveryAvailable: !!apiRestaurant.isDeliveryAvailable,
    active: !!apiRestaurant.active,
    description: apiRestaurant.description || '',
    deliveryRadiusMeters: apiRestaurant.deliveryRadiusMeters || 5000,
    license: apiRestaurant.license || 'N/A',
    managerId: typeof apiRestaurant.managerId === 'object' 
      ? (apiRestaurant.managerId?._id || '') 
      : (apiRestaurant.managerId || ''),
    openHours: apiRestaurant.openHours || '9:00 AM - 10:00 PM',
    reviews: apiRestaurant.reviews || [],
    reviewCount: apiRestaurant.reviewCount || 0,
    shortDescription: apiRestaurant.shortDescription || 
      (apiRestaurant.description ? 
        apiRestaurant.description.substring(0, 100) + 
        (apiRestaurant.description.length > 100 ? '...' : '') 
        : ''),
    deliveryFee: 0,
    estimatedDeliveryTime: '30-45 min',
    createdAt: apiRestaurant.createdAt || new Date().toISOString(),
    updatedAt: apiRestaurant.updatedAt || new Date().toISOString(),
    location: {
      latitude: coordinates[1],
      longitude: coordinates[0]
    }
  };
}

// Alias for backward compatibility
type Restaurant = AppRestaurant;

type PriceRange = 'Under 100 ETB' | '100-300 ETB' | '300-500 ETB' | '500+ ETB';

const priceRanges = [
  { label: 'Under 100 ETB', value: 'Under 100 ETB' as const },
  { label: '100-300 ETB', value: '100-300 ETB' as const },
  { label: '300-500 ETB', value: '300-500 ETB' as const },
  { label: '500+ ETB', value: '500+ ETB' as const },
];

const restaurantCategories = [
  'All',
  'Ethiopian',
  'Italian',
  'Chinese',
  'Indian',
  'Fast Food',
  'Vegan',
  'Other'
];

export default function RestaurantsScreen() {
  const router = useRouter();
  const { getCartItemsCount } = useCartStore();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  type Cuisine = {
    id: string;
    name: string;
    selected: boolean;
  };

  const initialCuisines: Cuisine[] = [
    { id: 'ethiopian', name: 'Ethiopian', selected: false },
    { id: 'italian', name: 'Italian', selected: false },
    { id: 'chinese', name: 'Chinese', selected: false },
    { id: 'indian', name: 'Indian', selected: false },
    { id: 'fast-food', name: 'Fast Food', selected: false },
    { id: 'vegan', name: 'Vegan', selected: false },
    { id: 'other', name: 'Other', selected: false },
  ];

  type Filters = {
    priceRange: [number, number];
    cuisines: Cuisine[];
    dietaryOptions: string[];
    minRating: number;
    openNow: boolean;
    deliveryTime: number;
  };

  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 1000],
    cuisines: [...initialCuisines],
    dietaryOptions: [],
    minRating: 0,
    openNow: false,
    deliveryTime: 60,
  });

  // Explicitly type the slider value change handler
  const handleSliderValueChange = (value: number) => {
    setFilters(prev => ({ ...prev, deliveryTime: value }));
  };

  // Fetch restaurants from API
  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching restaurants...');
      const response = await axios.get('https://gebeta-delivery1.onrender.com/api/v1/restaurants');
      console.log('API Response:', response);
      
      // Handle different possible response structures
      let restaurantsData = [];
      
      // Case 1: Data is nested under response.data.data.restaurants (from logs)
      if (response?.data?.data?.restaurants && Array.isArray(response.data.data.restaurants)) {
        console.log('Found restaurants in response.data.data.restaurants');
        restaurantsData = response.data.data.restaurants;
      } 
      // Case 2: Data is directly in response.data (array)
      else if (Array.isArray(response?.data)) {
        console.log('Found restaurants directly in response.data');
        restaurantsData = response.data;
      }
      // Case 3: Data is nested under response.data.data (array)
      else if (Array.isArray(response?.data?.data)) {
        console.log('Found restaurants in response.data.data');
        restaurantsData = response.data.data;
      } 
      // Case 4: No valid data found
      else {
        console.warn('Unexpected API response structure:', response?.data);
        throw new Error('Unexpected data format received from server');
      }
      
      console.log('Setting restaurants data:', restaurantsData);
      setRestaurants(restaurantsData);
      setFilteredRestaurants(restaurantsData);
      
    } catch (err: unknown) {
      console.error('Error fetching restaurants:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load restaurants. Please try again.';
      setError(errorMessage);
      setRestaurants([]);
      setFilteredRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Get location permission and current location
  const getLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: null,
                  accuracy: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                timestamp: Date.now(),
              });
              reverseGeocodeWithRetry(position.coords.latitude, position.coords.longitude)
                .then((geocode) => {
                  if (geocode && geocode.length > 0) {
                    const { city, region } = geocode[0];
                    setAddress(`${city || ''}, ${region || ''}`.trim() || 'Location found');
                  } else {
                    setAddress('Location not available');
                  }
                })
                .catch(() => setAddress('Please enter your location'));
            },
            () => setAddress('Please enter your location'),
            { timeout: 10000 }
          );
        } else {
          setAddress('Please enter your location');
        }
        setLocationPermission(true);
        setIsLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Promise.race([
          Location.getCurrentPositionAsync({}),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Location request timeout')), 10000)
          )
        ]);

        setLocation(location);

        try {
          const geocode = await reverseGeocodeWithRetry(
            location.coords.latitude,
            location.coords.longitude
          );

          if (geocode && geocode.length > 0) {
            const { city, region } = geocode[0];
            setAddress(`${city || ''}, ${region || ''}`.trim() || 'Location found');
          } else {
            setAddress('Location found (address not available)');
          }
        } catch (geocodeError) {
          console.warn('Reverse geocoding failed:', geocodeError);
          setAddress(`Location: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
        }
      } else {
        setAddress('Location permission denied');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setAddress('Error getting location. Using default location.');
      setLocation({
        coords: {
          latitude: 9.0054,
          longitude: 38.7636,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocodeWithRetry = async (latitude: number, longitude: number, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const geocode = await Promise.race([
          Location.reverseGeocodeAsync({ latitude, longitude }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Reverse geocoding timeout')), 10000)
          )
        ]);
        return geocode;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error('Max retries reached for reverse geocoding');
  };

  useEffect(() => {
    getLocation();
  }, []);

  const togglePriceRange = (priceRange: string) => {
    let min = 0;
    let max = 1000;

    switch (priceRange) {
      case 'Under 100 ETB':
        max = 99;
        break;
      case '100-300 ETB':
        min = 100;
        max = 300;
        break;
      case '300-500 ETB':
        min = 301;
        max = 500;
        break;
      case '500+ ETB':
        min = 501;
        max = 1000;
        break;
    }

    setFilters(prev => ({
      ...prev,
      priceRange: [min, max],
    }));
  };

  const toggleCuisine = (cuisineId: string) => {
    setFilters(prev => ({
      ...prev,
      cuisines: prev.cuisines.map(cuisine => 
        cuisine.id === cuisineId 
          ? { ...cuisine, selected: !cuisine.selected } 
          : cuisine
      ),
    }));
  };

  const toggleDietaryOption = (option: string) => {
    setFilters(prev => ({
      ...prev,
      dietaryOptions: prev.dietaryOptions.includes(option)
        ? prev.dietaryOptions.filter(item => item !== option)
        : [...prev.dietaryOptions, option],
    }));
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRestaurantPress = (restaurantId: string) => {
    router.push({
      pathname: '/restaurant/[id]',
      params: { id: restaurantId },
    });
  };

  const filterRestaurants = useCallback(() => {
    let filtered = [...restaurants];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisineTypes.some(cuisine => cuisine.toLowerCase().includes(query)) ||
        restaurant.description?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisineTypes.includes(selectedCategory)
      );
    }

    // Apply price range filter (assuming price range is estimated from rating)
    const [minPrice, maxPrice] = filters.priceRange;
    filtered = filtered.filter(restaurant => {
      // Estimate price based on rating (simplified logic, adjust as needed)
      const estimatedPrice = restaurant.ratingAverage * 100; // Example: 4.5 rating -> ~450 ETB
      return estimatedPrice >= minPrice && estimatedPrice <= maxPrice;
    });

    // Apply cuisine filter
    const selectedCuisines = filters.cuisines
      .filter(cuisine => cuisine.selected)
      .map(cuisine => cuisine.name);
    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisineTypes.some(cuisine => selectedCuisines.includes(cuisine))
      );
    }

    // Apply open now filter
    if (filters.openNow) {
      filtered = filtered.filter(restaurant => restaurant.isOpenNow);
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(restaurant => restaurant.ratingAverage >= filters.minRating);
    }

    // Apply dietary options filter
    if (filters.dietaryOptions.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.dietaryOptions.every(option => restaurant.cuisineTypes.includes(option))
      );
    }

    // Apply delivery time filter (assuming deliveryRadiusMeters correlates with delivery time)
    if (filters.deliveryTime) {
      filtered = filtered.filter(restaurant => {
        const estimatedDeliveryTime = Math.round(restaurant.deliveryRadiusMeters / 100); // Simplified: 100m = 1 min
        return estimatedDeliveryTime <= filters.deliveryTime;
      });
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCategory, filters, restaurants]);

  useEffect(() => {
    filterRestaurants();
  }, [filterRestaurants]);

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const isPriceRangeSelected = (range: string): boolean => {
    const [min, max] = filters.priceRange;
    switch (range) {
      case 'Under 100 ETB':
        return min === 0 && max === 99;
      case '100-300 ETB':
        return min === 100 && max === 300;
      case '300-500 ETB':
        return min === 301 && max === 500;
      case '500+ ETB':
        return min === 501 && max === 1000;
      default:
        return false;
    }
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      cuisines: initialCuisines,
      dietaryOptions: [],
      deliveryTime: 60,
      openNow: false,
      minRating: 0,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <MapPin size={20} color={colors.primary} style={styles.locationIcon} />
          <Text style={styles.locationText} numberOfLines={1}>
            {address}
          </Text>
          <ChevronDown size={16} color={colors.text} />
        </View>

      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.lightText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search restaurants"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
          accessibilityLabel="Open filter options"
        >
          <Settings size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {restaurantCategories.map(category => (
          <CategoryPill
            key={category}
            title={category}
            selected={selectedCategory === category}
            onPress={() => handleCategoryPress(category)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchRestaurants}
            accessibilityLabel="Retry loading restaurants"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredRestaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No restaurants found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.restaurantsList}
          contentContainerStyle={styles.restaurantsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRestaurants.map((restaurant: any) => {
            // Calculate delivery time based on distance (1 min per 100m)
            const deliveryTime = Math.ceil(restaurant.deliveryRadiusMeters / 100);
            const estimatedDeliveryTime = `${deliveryTime}-${deliveryTime + 15} min`;
            
            // Format price level based on rating average
            const restaurantData = toAppRestaurant(restaurant);
            
            return (
              <RestaurantCard
                key={restaurant._id}
                restaurant={restaurantData}
                onPress={() => router.push(`/restaurant/${restaurant._id}`)}
              />
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Restaurants</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                accessibilityLabel="Close filter modal"
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range (ETB)</Text>
                <View style={styles.priceRangeContainer}>
                  {priceRanges.map(price => {
                    const isSelected = isPriceRangeSelected(price.value);
                    return (
                      <TouchableOpacity
                        key={price.value}
                        style={[
                          styles.priceButton,
                          isSelected && styles.priceButtonSelected,
                        ]}
                        onPress={() => togglePriceRange(price.value)}
                        accessibilityLabel={`Select price range ${price.label}`}
                      >
                        <Text
                          style={[
                            styles.priceButtonText,
                            isSelected && styles.priceButtonTextSelected,
                          ]}
                        >
                          {price.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Cuisine Type</Text>
                <View style={styles.tagsContainer}>
                  {filters.cuisines.map(cuisine => (
                    <TouchableOpacity
                      key={cuisine.id}
                      style={[
                        styles.tagButton,
                        cuisine.selected && styles.tagButtonSelected,
                      ]}
                      onPress={() => toggleCuisine(cuisine.id)}
                      accessibilityLabel={`Select ${cuisine.name} cuisine`}
                    >
                      <Text
                        style={[
                          styles.tagButtonText,
                          cuisine.selected ? styles.tagButtonTextSelected : null,
                        ]}
                      >
                        {cuisine.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Dietary Options</Text>
                <View style={styles.tagsContainer}>
                  {filters.dietaryOptions.length > 0 && (
                    <Text style={styles.filterBadge}>
                      {filters.dietaryOptions.length}
                    </Text>
                  )}
                  {['Vegan'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.tagButton,
                        filters.dietaryOptions.includes(option) && styles.tagButtonSelected,
                      ]}
                      onPress={() => toggleDietaryOption(option)}
                      accessibilityLabel={`Select ${option} dietary option`}
                    >
                      <Text
                        style={[
                          styles.tagButtonText,
                          filters.dietaryOptions.includes(option) && styles.tagButtonTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Max Delivery Time: {filters.deliveryTime} min
                </Text>
                <Slider
                  style={styles.sliderTrack}
                  minimumValue={15}
                  maximumValue={120}
                  step={1}
                  value={filters.deliveryTime}
                  onValueChange={handleSliderValueChange}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.lightGray}
                  thumbTintColor={Platform.OS === 'android' ? colors.primary : undefined}
                  accessibilityLabel="Adjust maximum delivery time"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>15 min</Text>
                  <Text style={styles.sliderLabel}>60 min</Text>
                  <Text style={styles.sliderLabel}>120 min</Text>
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                  <Text style={styles.filterSectionTitle}>Open Now</Text>
                  <Switch
                    value={filters.openNow}
                    onValueChange={value =>
                      setFilters(prev => ({ ...prev, openNow: value }))
                    }
                    trackColor={{ false: colors.lightGray, true: colors.primary }}
                    thumbColor="#fff"
                    accessibilityLabel="Toggle open now filter"
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() =>
                        setFilters(prev => ({
                          ...prev,
                          minRating: prev.minRating === star ? 0 : star,
                        }))
                      }
                      accessibilityLabel={`Set minimum rating to ${star} stars`}
                    >
                      <Text
                        style={[
                          styles.ratingStar,
                          star <= filters.minRating && styles.ratingStarSelected,
                        ]}
                      >
                        {star <= filters.minRating ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.ratingText}>
                    {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.filterButton, styles.resetButton]}
                onPress={resetFilters}
                accessibilityLabel="Reset all filters"
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, styles.applyButton]}
                onPress={applyFilters}
                accessibilityLabel="Apply filters"
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
       
       {/* Floating Cart Button - Only visible when there are items in cart */}
       {getCartItemsCount() > 0 && (
         <TouchableOpacity
           style={styles.floatingCartButton}
           onPress={() => router.push("/cart")}
         >
           <ShoppingBag size={24} color={colors.white} />
           <View style={styles.cartBadge}>
             <Text style={styles.cartBadgeText}>{getCartItemsCount()}</Text>
           </View>
         </TouchableOpacity>
       )}
     </SafeAreaView>
   );
}

const styles = StyleSheet.create({
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00000022',
    position: 'relative',
    overflow: 'hidden',
  },
  trackActive: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#0000FF',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0000FF',
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text,
    ...typography.body,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  cartButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...typography.h4,
    fontWeight: '700',
  },
  filterOptions: {
    maxHeight: '80%',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterBadge: {
    position: 'absolute',
    right: 8,
    top: -8,
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterSectionTitle: {
    ...typography.subtitle,
    marginBottom: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagButtonText: {
    ...typography.small,
    color: colors.text,
  },
  tagButtonTextSelected: {
    color: colors.white,
  },
  sliderTrack: {
    height: 4,
    marginVertical: 12,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabel: {
    ...typography.small,
    color: colors.lightText,
  },
  priceButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  priceButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priceButtonText: {
    ...typography.body,
    color: colors.text,
  },
  priceButtonTextSelected: {
    color: colors.white,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingStar: {
    fontSize: 24,
    color: colors.lightGray,
  },
  ratingStarSelected: {
    color: colors.warning,
  },
  ratingText: {
    ...typography.body,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  applyButton: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.text,
  },
  applyButtonText: {
    ...typography.button,
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightText,
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
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.lightText,
  },
  restaurantsList: {
    flex: 1,
  },
  restaurantsListContent: {
    padding: 16,
    paddingTop: 0,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});