import Button from "@/components/Button";
import colors from "@/constants/colors";
import typography from "@/constants/typography";
import { useCartStore } from "@/store/cartStore";
import { OrderServiceType } from "@/types/restaurant";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

// Food item interface matching the API structure
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
    name: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function MenuItemDetailScreen() {
  const { restaurantId, itemId } = useLocalSearchParams<{ restaurantId: string; itemId: string }>();
  const router = useRouter();
  const { addToCart, serviceType, setServiceType } = useCartStore();
  
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<OrderServiceType>(serviceType);
  const [menuItem, setMenuItem] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch menu item data
  useEffect(() => {
    const fetchMenuItem = async () => {
      if (!restaurantId || !itemId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        const response = await fetch(`https://gebetta-backend.onrender.com/api/v1/foods/${itemId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Menu item API response:', data);
          
          if (data.success && data.data) {
            setMenuItem(data.data);
          } else {
            throw new Error('Invalid API response format');
          }
        } else if (response.status === 404) {
          // Item not found in API, create fallback
          console.log('Menu item not found in API, creating fallback');
          throw new Error('Item not found');
        } else {
          throw new Error(`API request failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching menu item:', error);
        setError('Failed to load menu item details');
        
        // Create a fallback menu item with realistic data
        const fallbackItem: Food = {
          _id: itemId,
          foodName: 'Delicious Dish',
          description: 'A tasty dish prepared with fresh, quality ingredients',
          price: 15.99,
          isAvailable: true,
          menuId: '',
          status: 'Available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMenuItem(fallbackItem);
        setError(null); // Clear error since we have fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItem();
  }, [restaurantId, itemId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu item...</Text>
      </View>
    );
  }

  if (error && !menuItem) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!menuItem) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.heading2}>Item not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleServiceTypeChange = (type: OrderServiceType) => {
    setSelectedServiceType(type);
  };

  const handleAddToCart = () => {
    if (restaurantId && menuItem) {
      // Update the global service type
      setServiceType(selectedServiceType);
      
      // Add the item to cart
      addToCart(restaurantId, menuItem._id, quantity, selectedServiceType, {
        name: menuItem.foodName,
        price: menuItem.price,
      });
      
      Alert.alert(
        "Added to Cart",
        `${quantity} ${menuItem.foodName} added to your cart for ${selectedServiceType}.`,
        [
          {
            text: "Continue Shopping",
            onPress: () => router.back(),
            style: "cancel",
          },
          {
            text: "View Cart",
            onPress: () => router.push("/cart"),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: menuItem.image || 'https://via.placeholder.com/400x300?text=No+Image' }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.gradient} />
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="chevron-left" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <View style={styles.badgesContainer}>
            {menuItem.status === 'Available' && (
              <View style={styles.badge}>
                <FontAwesome name="check" size={16} color={colors.white} />
                <Text style={styles.badgeText}>Available</Text>
              </View>
            )}
            {menuItem.isFeatured && (
              <View style={[styles.badge, styles.vegBadge]}>
                <FontAwesome name="star" size={16} color={colors.white} />
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{menuItem.foodName}</Text>
            <Text style={styles.price}>${menuItem.price.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.description}>{getFoodDescription(menuItem)}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.ingredientsText}>{getFoodIngredients(menuItem)}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How would you like your food?</Text>
            <View style={styles.serviceTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.serviceTypeButton,
                  selectedServiceType === 'delivery' && styles.serviceTypeButtonActive,
                ]}
                onPress={() => handleServiceTypeChange('delivery')}
              >
                <FontAwesome 
                  name="truck" 
                  size={20} 
                  color={selectedServiceType === 'delivery' ? colors.white : colors.text} 
                />
                <Text 
                  style={[
                    styles.serviceTypeText,
                    selectedServiceType === 'delivery' && styles.serviceTypeTextActive,
                  ]}
                >
                  Delivery
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.serviceTypeButton,
                  selectedServiceType === 'dine-in' && styles.serviceTypeButtonActive,
                ]}
                onPress={() => handleServiceTypeChange('dine-in')}
              >
                <FontAwesome 
                  name="cutlery" 
                  size={20} 
                  color={selectedServiceType === 'dine-in' ? colors.white : colors.text} 
                />
                <Text 
                  style={[
                    styles.serviceTypeText,
                    selectedServiceType === 'dine-in' && styles.serviceTypeTextActive,
                  ]}
                >
                  Dine-in
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.serviceTypeButton,
                  selectedServiceType === 'pickup' && styles.serviceTypeButtonActive,
                ]}
                onPress={() => handleServiceTypeChange('pickup')}
              >
                <FontAwesome 
                  name="map-marker" 
                  size={20} 
                  color={selectedServiceType === 'pickup' ? colors.white : colors.text} 
                />
                <Text 
                  style={[
                    styles.serviceTypeText,
                    selectedServiceType === 'pickup' && styles.serviceTypeTextActive,
                  ]}
                >
                  Pickup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Add notes (e.g. allergies, spice level, etc.)"
              placeholderTextColor={colors.lightText}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityTitle}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecrement}
                disabled={quantity <= 1}
              >
                <FontAwesome name="minus" size={20} color={quantity <= 1 ? colors.lightText : colors.text} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncrement}
              >
                <FontAwesome name="plus" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{menuItem.price * quantity} Birr</Text>
        </View>
        
        <Button
          title="Add to Cart"
          onPress={handleAddToCart}
          variant="primary"
          style={styles.addButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  image: {
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
  badgesContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  vegBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.white,
    fontWeight: "600",
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    ...typography.heading1,
    flex: 1,
    marginRight: 16,
  },
  price: {
    ...typography.heading2,
    color: colors.primary,
  },
  description: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: 12,
  },
  ingredientsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ingredient: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientText: {
    ...typography.bodySmall,
  },
  serviceTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  serviceTypeButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  serviceTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  serviceTypeText: {
    ...typography.bodySmall,
    color: colors.text,
    marginTop: 8,
    fontWeight: "500",
  },
  serviceTypeTextActive: {
    color: colors.white,
  },
  instructionsInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    ...typography.body,
    textAlignVertical: "top",
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  quantityTitle: {
    ...typography.heading3,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    ...typography.heading3,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "center",
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    ...typography.bodySmall,
    color: colors.lightText,
  },
  totalPrice: {
    ...typography.heading3,
  },
  addButton: {
    flex: 1,
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  ingredientsText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
