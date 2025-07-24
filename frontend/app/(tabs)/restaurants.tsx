import CategoryPill from "@/components/CategoryPill";
import RestaurantCard from "@/components/RestaurantCard";
import colors from "@/constants/colors";
import typography from "@/constants/typography";
// Remove the import since we're defining them in this file
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ChevronDown, MapPin, Search, X, Check } from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Modal, Switch } from "react-native";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Define the OpeningHours interface for restaurant operating hours
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type OpeningHours = Record<string, { open: string; close: string }>;

interface Restaurant {
  id: string;
  name: string;
  image: string;
  imageUrl: string;
  rating: number;
  deliveryTime: string;
  minOrder: string;
  categories: string[];
  cuisine: string;
  priceLevel: string; // Changed to only accept string
  isOpen: boolean;
  distance: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  dietaryOptions?: string[];
  openingHours?: OpeningHours;
}

type PriceRange = 'Under 100 ETB' | '100-300 ETB' | '300-500 ETB' | '500+ ETB';

const priceRanges = [
  { label: 'Under 100 ETB', value: 'Under 100 ETB' as const },
  { label: '100-300 ETB', value: '100-300 ETB' as const },
  { label: '300-500 ETB', value: '300-500 ETB' as const },
  { label: '500+ ETB', value: '500+ ETB' as const },
];

// Mock data for restaurants
const mockRestaurants: Restaurant[] = [
  // Ethiopian Cuisine
  {
    id: '1',
    name: 'Habesha Restaurant',
    image: 'https://images.unsplash.com/photo-1590845947676-fa2576f401d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1590845947676-fa2576f401d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.5,
    deliveryTime: '30-45 min',
    minOrder: '100 ETB',
    categories: ['Ethiopian', 'Traditional'],
    cuisine: 'Ethiopian',
    priceLevel: '150-300 ETB',
    isOpen: true,
    distance: '1.2 km',
    address: '123 Bole Road, Addis Ababa',
    ownerId: 'owner123',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    estimatedDeliveryTime: '45',
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'],
    openingHours: {
      'Monday': { open: '09:00', close: '22:00' },
      'Tuesday': { open: '09:00', close: '22:00' },
      'Wednesday': { open: '09:00', close: '22:00' },
      'Thursday': { open: '09:00', close: '22:00' },
      'Friday': { open: '09:00', close: '23:00' },
      'Saturday': { open: '09:00', close: '23:00' },
      'Sunday': { open: '09:00', close: '22:00' }
    }
  },
  {
    id: '2',
    name: 'Tibs Village',
    image: 'https://images.unsplash.com/photo-1645112411351-3ec33976b9a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1645112411351-3ec33976b9a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.2,
    deliveryTime: '20-30 min',
    minOrder: '50 ETB',
    categories: ['Ethiopian', 'Grill'],
    cuisine: 'Ethiopian',
    priceLevel: '100-250 ETB',
    isOpen: true,
    distance: '0.8 km',
    address: '456 Bole Road, Addis Ababa',
    ownerId: 'owner456',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z',
    estimatedDeliveryTime: '30',
    dietaryOptions: ['Meat Lovers', 'Spicy', 'Halal'],
    openingHours: {
      'Monday': { open: '10:00', close: '23:00' },
      'Tuesday': { open: '10:00', close: '23:00' },
      'Wednesday': { open: '10:00', close: '23:00' },
      'Thursday': { open: '10:00', close: '23:00' },
      'Friday': { open: '10:00', close: '00:00' },
      'Saturday': { open: '10:00', close: '00:00' },
      'Sunday': { open: '10:00', close: '23:00' }
    }
  },
  {
    id: '3',
    name: 'Injera Time',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.0,
    deliveryTime: '25-40 min',
    minOrder: '75 ETB',
    categories: ['Ethiopian', 'Vegetarian'],
    cuisine: 'Ethiopian',
    priceLevel: '80-200 ETB',
    isOpen: true,
    distance: '1.5 km',
    address: '789 Bole Road, Addis Ababa',
    ownerId: 'owner789',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z',
    estimatedDeliveryTime: '40',
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    openingHours: {
      'Monday': { open: '08:00', close: '21:00' },
      'Tuesday': { open: '08:00', close: '21:00' },
      'Wednesday': { open: '08:00', close: '21:00' },
      'Thursday': { open: '08:00', close: '21:00' },
      'Friday': { open: '08:00', close: '22:00' },
      'Saturday': { open: '08:00', close: '22:00' },
      'Sunday': { open: '08:00', close: '21:00' }
    }
  },
  
  // Italian Cuisine
  {
    id: '4',
    name: 'Bella Italia',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.6,
    deliveryTime: '35-50 min',
    minOrder: '150 ETB',
    categories: ['Italian', 'Pasta', 'Pizza'],
    cuisine: 'Italian',
    priceLevel: '200-500 ETB',
    isOpen: true,
    distance: '2.1 km',
    address: '101 Bishoftu Road, Addis Ababa',
    ownerId: 'owner101',
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-02-10T00:00:00Z',
    estimatedDeliveryTime: '45',
    dietaryOptions: ['Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    openingHours: {
      'Monday': { open: '11:00', close: '23:00' },
      'Tuesday': { open: '11:00', close: '23:00' },
      'Wednesday': { open: '11:00', close: '23:00' },
      'Thursday': { open: '11:00', close: '23:00' },
      'Friday': { open: '11:00', close: '00:00' },
      'Saturday': { open: '11:00', close: '00:00' },
      'Sunday': { open: '11:00', close: '23:00' }
    }
  },
  {
    id: '5',
    name: 'Pizza Palace',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.3,
    deliveryTime: '30-45 min',
    minOrder: '120 ETB',
    categories: ['Italian', 'Pasta'],
    cuisine: 'Italian',
    priceLevel: '150-400 ETB',
    isOpen: true,
    distance: '1.8 km',
    address: '202 Kazanchis, Addis Ababa',
    ownerId: 'owner202',
    createdAt: '2023-02-15T00:00:00Z',
    updatedAt: '2023-02-15T00:00:00Z',
    estimatedDeliveryTime: '40',
    dietaryOptions: ['Vegetarian', 'Vegan Options'],
    openingHours: {
      'Monday': { open: '10:30', close: '22:30' },
      'Tuesday': { open: '10:30', close: '22:30' },
      'Wednesday': { open: '10:30', close: '22:30' },
      'Thursday': { open: '10:30', close: '22:30' },
      'Friday': { open: '10:30', close: '23:30' },
      'Saturday': { open: '10:30', close: '23:30' },
      'Sunday': { open: '10:30', close: '22:30' }
    }
  },
  
  // Chinese Cuisine
  {
    id: '6',
    name: 'Dragon Garden',
    image: 'https://example.com/dragon-garden.jpg',
    imageUrl: 'https://example.com/dragon-garden.jpg',
    rating: 4.4,
    deliveryTime: '25-40 min',
    minOrder: '100 ETB',
    categories: ['Chinese', 'Asian'],
    cuisine: 'Chinese',
    priceLevel: '150-350 ETB',
    isOpen: true,
    distance: '2.5 km',
    address: '303 Bole Road, Addis Ababa',
    ownerId: 'owner303',
    createdAt: '2023-01-20T00:00:00Z',
    updatedAt: '2023-01-20T00:00:00Z',
    estimatedDeliveryTime: '35',
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    openingHours: {
      'Monday': { open: '10:00', close: '22:00' },
      'Tuesday': { open: '10:00', close: '22:00' },
      'Wednesday': { open: '10:00', close: '22:00' },
      'Thursday': { open: '10:00', close: '22:00' },
      'Friday': { open: '10:00', close: '23:00' },
      'Saturday': { open: '10:00', close: '23:00' },
      'Sunday': { open: '10:00', close: '22:00' }
    }
  },
  
  // Indian Cuisine
  {
    id: '7',
    name: 'Taj Mahal',
    image: 'https://example.com/taj-mahal.jpg',
    imageUrl: 'https://example.com/taj-mahal.jpg',
    rating: 4.7,
    deliveryTime: '30-45 min',
    minOrder: '120 ETB',
    categories: ['Indian', 'Asian'],
    cuisine: 'Indian',
    priceLevel: '150-400 ETB',
    isOpen: true,
    distance: '1.7 km',
    address: '404 Bole Road, Addis Ababa',
    ownerId: 'owner404',
    createdAt: '2023-01-25T00:00:00Z',
    updatedAt: '2023-01-25T00:00:00Z',
    estimatedDeliveryTime: '40',
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'],
    openingHours: {
      'Monday': { open: '10:00', close: '22:30' },
      'Tuesday': { open: '10:00', close: '22:30' },
      'Wednesday': { open: '10:00', close: '22:30' },
      'Thursday': { open: '10:00', close: '22:30' },
      'Friday': { open: '10:00', close: '23:30' },
      'Saturday': { open: '10:00', close: '23:30' },
      'Sunday': { open: '10:00', close: '22:30' }
    }
  },
  
  // Japanese Cuisine
  {
    id: '8',
    name: 'Sakura Sushi',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    rating: 4.8,
    deliveryTime: '35-50 min',
    minOrder: '200 ETB',
    categories: ['Japanese', 'Sushi', 'Asian'],
    cuisine: 'Japanese',
    priceLevel: '300-800 ETB',
    isOpen: true,
    distance: '3.0 km',
    address: '505 Bole Road, Addis Ababa',
    ownerId: 'owner505',
    createdAt: '2023-02-05T00:00:00Z',
    updatedAt: '2023-02-05T00:00:00Z',
    estimatedDeliveryTime: '45',
    dietaryOptions: ['Pescatarian', 'Gluten-Free'],
    openingHours: {
      'Monday': { open: '11:30', close: '22:00' },
      'Tuesday': { open: '11:30', close: '22:00' },
      'Wednesday': { open: '11:30', close: '22:00' },
      'Thursday': { open: '11:30', close: '22:00' },
      'Friday': { open: '11:30', close: '23:00' },
      'Saturday': { open: '11:30', close: '23:00' },
      'Sunday': { open: '11:30', close: '22:00' }
    }
  },
  
  // Mexican Cuisine
  {
    id: '9',
    name: 'Fiesta Mexicana',
    image: 'https://example.com/fiesta-mexicana.jpg',
    imageUrl: 'https://example.com/fiesta-mexicana.jpg',
    rating: 4.5,
    deliveryTime: '25-40 min',
    minOrder: '130 ETB',
    categories: ['Mexican', 'Latin'],
    cuisine: 'Mexican',
    priceLevel: '150-400 ETB',
    isOpen: true,
    distance: '2.2 km',
    address: '606 Bole Road, Addis Ababa',
    ownerId: 'owner606',
    createdAt: '2023-02-08T00:00:00Z',
    updatedAt: '2023-02-08T00:00:00Z',
    estimatedDeliveryTime: '35',
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    openingHours: {
      'Monday': { open: '11:00', close: '22:00' },
      'Tuesday': { open: '11:00', close: '22:00' },
      'Wednesday': { open: '11:00', close: '22:00' },
      'Thursday': { open: '11:00', close: '22:00' },
      'Friday': { open: '11:00', close: '23:00' },
      'Saturday': { open: '11:00', close: '23:00' },
      'Sunday': { open: '11:00', close: '22:00' }
    }
  },
  
  // Middle Eastern Cuisine
  {
    id: '10',
    name: 'Aladdin Shawarma',
    image: 'https://example.com/aladdin-shawarma.jpg',
    imageUrl: 'https://example.com/aladdin-shawarma.jpg',
    rating: 4.3,
    deliveryTime: '20-35 min',
    minOrder: '80 ETB',
    categories: ['Middle Eastern', 'Halal', 'Fast Food'],
    cuisine: 'Middle Eastern',
    priceLevel: '80-250 ETB',
    isOpen: true,
    distance: '1.3 km',
    address: '707 Bole Road, Addis Ababa',
    ownerId: 'owner707',
    createdAt: '2023-02-12T00:00:00Z',
    updatedAt: '2023-02-12T00:00:00Z',
    estimatedDeliveryTime: '30',
    dietaryOptions: ['Halal', 'Vegetarian'],
    openingHours: {
      'Monday': { open: '09:00', close: '23:00' },
      'Tuesday': { open: '09:00', close: '23:00' },
      'Wednesday': { open: '09:00', close: '23:00' },
      'Thursday': { open: '09:00', close: '23:00' },
      'Friday': { open: '09:00', close: '00:00' },
      'Saturday': { open: '09:00', close: '00:00' },
      'Sunday': { open: '09:00', close: '23:00' }
    }
  }
];

const restaurantCategories = [
  'All',
  'Ethiopian',
  'Italian',
  'Chinese',
  'Indian',
  'Japanese',
  'Mexican',
  'Middle Eastern',
  'Vegetarian',
  'Vegan',
  'Fast Food',
  'Pizza',
  'Pasta',
  'Sushi',
  'Halal'
];

export default function RestaurantsScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const parseDeliveryTime = (timeStr: string | number | undefined): number => {
    if (!timeStr) return 0;
    const str = String(timeStr);
    const matches = str.match(/(\d+)/g);
    if (!matches || matches.length === 0) return 0;
    const nums = matches.map(Number);
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  };

  // Using the restaurantCategories defined outside the component
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  type CuisineType = {
    id: string;
    name: string;
    selected: boolean;
  };

  const initialCuisines: CuisineType[] = [
    { id: 'ethiopian', name: 'Ethiopian', selected: false },
    { id: 'italian', name: 'Italian', selected: false },
    { id: 'chinese', name: 'Chinese', selected: false },
    { id: 'indian', name: 'Indian', selected: false },
    { id: 'mexican', name: 'Mexican', selected: false },
  ];

  // Define the Filters type
  type Cuisine = {
    id: string;
    name: string;
    selected: boolean;
  };

  type Filters = {
    priceRange: [number, number];
    cuisines: Cuisine[];
    dietaryOptions: string[];
    minRating: number;
    openNow: boolean;
    deliveryTime: number | null;
  };

  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 1000],
    cuisines: [...initialCuisines],
    dietaryOptions: [],
    minRating: 0,
    openNow: false,
    deliveryTime: 60, // Default to 60 minutes
  });

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
      priceRange: [min, max]
    }));
  };

  const toggleCuisine = (cuisineId: string) => {
    setFilters(prev => ({
      ...prev,
      cuisines: prev.cuisines.map(cuisine => 
        cuisine.id === cuisineId 
          ? { ...cuisine, selected: !cuisine.selected } 
          : cuisine
      )
    }));
  };

  const toggleDietaryOption = (option: string) => {
    setFilters(prev => ({
      ...prev,
      dietaryOptions: prev.dietaryOptions.includes(option)
        ? prev.dietaryOptions.filter(item => item !== option)
        : [...prev.dietaryOptions, option]
    }));
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRestaurantPress = (restaurantId: string) => {
    // Navigate to the restaurant details page with the restaurant ID
    router.push({
      pathname: "/restaurant/[id]",
      params: { id: restaurantId }
    });
  };

  // Helper function to retry reverse geocoding with exponential backoff
  const reverseGeocodeWithRetry = async (latitude: number, longitude: number, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const geocode = await Promise.race([
          Location.reverseGeocodeAsync({ latitude, longitude }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Reverse geocoding timeout')), 10000) // 10 second timeout
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

  // Get location permission and current location
  const getLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Handle web differently since expo-location has limited support
        setAddress("New York, NY");
        setLocationPermission(true);
        setIsLoading(false);
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
      
      if (status === "granted") {
        // Get current position with timeout
        const location = await Promise.race([
          Location.getCurrentPositionAsync({}),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Location request timeout')), 10000) // 10 second timeout
          )
        ]);
        
        setLocation(location);
        
        try {
          // Get address from coordinates with retry logic
          const geocode = await reverseGeocodeWithRetry(
            location.coords.latitude,
            location.coords.longitude
          );
          
          if (geocode && geocode.length > 0) {
            const locationInfo = geocode[0];
            const city = 'city' in locationInfo ? locationInfo.city : '';
            const region = 'region' in locationInfo ? locationInfo.region : '';
            setAddress(`${city || ""}, ${region || ""}`.trim() || "Location found");
          } else {
            setAddress("Location found (address not available)");
          }
        } catch (geocodeError) {
          console.warn("Reverse geocoding failed:", geocodeError);
          setAddress(`Location: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
        }
      } else {
        setAddress("Location permission denied");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setAddress("Error getting location. Using default location.");
      // Set a default location (Addis Ababa) if location fails
      setLocation({
        coords: {
          latitude: 9.0054,
          longitude: 38.7636,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    getLocation();
  }, []);

  // Filter restaurants based on search query, category, and filters with type safety
  const filterRestaurants = useCallback((): void => {
    let filtered = [...restaurants];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((restaurant: Restaurant) => 
        restaurant.name.toLowerCase().includes(query) ||
        (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query)) ||
        (restaurant.categories && restaurant.categories.some((cat: string) => 
          cat.toLowerCase().includes(query)
        ))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((restaurant: Restaurant) => 
        (restaurant.categories && restaurant.categories.includes(selectedCategory)) ||
        (restaurant.cuisine && restaurant.cuisine === selectedCategory)
      );
    }
    
    // Apply price range filter
    const [minPrice, maxPrice] = filters.priceRange;
    filtered = filtered.filter((restaurant) => {
      if (!restaurant.priceLevel) return false;
      
      // Extract numeric values from price level string (e.g., '100-300 ETB' -> {min: 100, max: 300})
      const priceRangeMatch = restaurant.priceLevel.match(/(\d+)(?:-(\d+))?/);
      if (!priceRangeMatch) return false;
      
      const min = parseInt(priceRangeMatch[1], 10);
      const max = priceRangeMatch[2] ? parseInt(priceRangeMatch[2], 10) : min;
      
      // Check if the restaurant's price range overlaps with the filter range
      return min <= maxPrice && max >= minPrice;
    });
    
    // Apply cuisine filter
    const selectedCuisines = filters.cuisines
      .filter(cuisine => cuisine.selected)
      .map(cuisine => cuisine.id.toLowerCase());
      
    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(restaurant => 
        restaurant.cuisine && 
        selectedCuisines.includes(restaurant.cuisine.toLowerCase())
      );
    }
    
    // Apply open now filter
    if (filters.openNow) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.getHours() * 100 + now.getMinutes();

      filtered = filtered.filter((restaurant) => {
        const hours = restaurant.openingHours?.[currentDay];
        if (!hours) return false;
        
        // Check if the restaurant is open at the current time
        const { open, close } = hours;
        
        // Convert time strings to minutes since midnight for comparison
        const parseTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 100 + (minutes || 0);
        };
          
        const openTimeInMinutes = parseTime(open);
        let closeTimeInMinutes = parseTime(close);
        
        // Handle overnight hours
        if (closeTimeInMinutes < openTimeInMinutes) {
          closeTimeInMinutes += 2400; // Add 24 hours
        }
        
        return currentTime >= openTimeInMinutes && currentTime <= closeTimeInMinutes;
      });
    }
    
    // Apply rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(
        (restaurant) => restaurant.rating >= filters.minRating
      );
    }
    
    // Apply dietary options filter
    if (filters.dietaryOptions.length > 0) {
      filtered = filtered.filter(restaurant => 
        restaurant.dietaryOptions && 
        filters.dietaryOptions.every(option => 
          restaurant.dietaryOptions?.includes(option)
        )
      );
    }
    
    // Apply delivery time filter
    if (filters.deliveryTime !== null) {
      filtered = filtered.filter(restaurant => {
        const deliveryTime = parseDeliveryTime(restaurant.deliveryTime);
        return deliveryTime > 0 && deliveryTime <= filters.deliveryTime!;
      });
    }
    
    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCategory, filters, restaurants, setFilteredRestaurants]);

  // Call filterRestaurants when dependencies change
  useEffect(() => {
    filterRestaurants();
  }, [filterRestaurants]);
  
  const applyFilters = () => {
    setShowFilterModal(false);
  };

  // Helper function to check if a price range matches the current filter
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

  // Reset all filters
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
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <FontAwesome5 name="filter" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {restaurantCategories.map((category) => (
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
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => handleRestaurantPress(restaurant.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Filter Modal */}
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
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range (ETB)</Text>
                <View style={styles.priceRangeContainer}>
                  {priceRanges.map((price) => {
                    const isSelected = isPriceRangeSelected(price.value);
                    return (
                      <TouchableOpacity
                        key={price.value}
                        style={[
                          styles.priceButton,
                          isSelected && styles.priceButtonSelected,
                        ]}
                        onPress={() => togglePriceRange(price.value)}
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
                  {filters.cuisines.map((cuisine) => (
                    <TouchableOpacity
                      key={cuisine.id}
                      style={[
                        styles.tagButton,
                        cuisine.selected && styles.tagButtonSelected,
                      ]}
                      onPress={() => toggleCuisine(cuisine.id)}
                    >
                      <Text
                        style={[
                          styles.tagButtonText,
                          cuisine.selected && styles.tagButtonTextSelected,
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
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.tagButton,
                        filters.dietaryOptions.includes(option) && styles.tagButtonSelected,
                      ]}
                      onPress={() => toggleDietaryOption(option)}
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
                <View style={styles.filterRow}>
                  <Text style={styles.filterSectionTitle}>
                    Max Delivery Time: {filters.deliveryTime} min
                  </Text>
                </View>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View 
                      style={[
                        styles.sliderFill,
                        { width: `${((filters.deliveryTime || 60) / 120) * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>15 min</Text>
                    <Text style={styles.sliderLabel}>60 min</Text>
                    <Text style={styles.sliderLabel}>120 min</Text>
                  </View>
                  <View style={styles.sliderThumbContainer}>
                    <View 
                      style={styles.sliderThumb}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderMove={(e) => {
                        const { locationX } = e.nativeEvent;
                        const containerWidth = e.currentTarget.measure(() => {});
                        const percentage = Math.min(Math.max(locationX / 300, 0), 1);
                        const newValue = Math.round(15 + (percentage * 105)); // 15 to 120 minutes
                        setFilters(prev => ({ ...prev, maxDeliveryTime: newValue }));
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                  <Text style={styles.filterSectionTitle}>Open Now</Text>
                  <Switch
                    value={filters.openNow}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, openNow: value }))
                    }
                    trackColor={{ false: colors.lightGray, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          minRating: prev.minRating === star ? 0 : star,
                        }))
                      }
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
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
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
  sliderContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    position: 'relative',
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
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
  sliderThumbContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    justifyContent: 'center',
    marginTop: -10,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: '50%',
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});
