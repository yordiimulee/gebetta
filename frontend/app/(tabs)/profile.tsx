import RecipeCard from "@/components/RecipeCard";
import colors from "@/constants/colors";
import typography from "@/constants/typography";
import { useAuthStore, type User } from "@/store/useAuthStore";
import { useCartStore } from "@/store/cartStore";
import { useProfileStore } from "@/store/profileStore";
import { useRecipeStore } from "@/store/recipeStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { useRouter } from "expo-router";
import {
  Bookmark,
  ChevronRight,
  CreditCard,
  Edit2,
  Grid,
  LogOut,
  MapPin,
  Settings,
  ShoppingBag,
  UserMinus,
  UserPlus,
} from "lucide-react-native";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Extend the User interface from useAuthStore
interface ExtendedUser extends Omit<User, 'id'> {
  _id: string;
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  followers?: number;
  following?: number;
  recipes?: number;
  reviews?: number;
}

export default function ProfileScreen() {
  const { user, isAuthenticated, isLoading: isAuthLoading, initializeAuth, debugAuthState } = useAuthStore();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log('ProfileScreen: Initializing auth...');
        await initializeAuth();
        
        // Debug: Log the current auth state
        const debugData = await debugAuthState();
        setDebugInfo(debugData);
        console.log('ProfileScreen: Auth debug info:', debugData);
        
      } catch (error) {
        console.error('ProfileScreen: Error initializing auth:', error);
      } finally {
        setInitialized(true);
      }
    };
    
    init();
  }, [initializeAuth, debugAuthState]);

  // Handle redirection when not authenticated
  useEffect(() => {
    console.log('ProfileScreen: Auth state changed', {
      initialized,
      isAuthLoading,
      isAuthenticated,
      hasUser: !!user
    });
    
    if (initialized && !isAuthLoading) {
      if (!isAuthenticated || !user) {
        console.log('ProfileScreen: Not authenticated, redirecting to auth screen');
        router.replace('/(auth)');
      }
    }
  }, [initialized, isAuthLoading, isAuthenticated, user, router]);
  
  // Show loading state while checking auth
  if (isAuthLoading || !initialized) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading your profile...</Text>
        {debugInfo && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
              Debug: {JSON.stringify(debugInfo, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  // If not authenticated, show nothing (will be redirected by the useEffect)
  if (!isAuthenticated || !user) {
    console.log('ProfileScreen: Not authenticated, rendering nothing');
    return null;
  }
  
  // Render the actual profile content
  return <ProfileContent />;
}

function ProfileContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { recipes } = useRecipeStore();
  const { addresses, paymentMethods } = useProfileStore();
  const { orders, getCartItemsCount } = useCartStore();
  const [activeTab, setActiveTab] = useState<"recipes" | "saved">("recipes");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<ExtendedUser | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update profile user when user data changes
  useEffect(() => {
    if (user) {
      const extendedUser: ExtendedUser = {
        ...user,
        name: user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
        avatar: user.profilePicture,
        bio: '',
        location: '',
        followers: 0,
        following: 0,
        recipes: 0,
        reviews: 0,
      };
      setProfileUser(extendedUser);
    }
  }, [user]);

  // Show loading state while profile is loading
  if (isLoadingProfile || !profileUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Ensure we have a valid user before proceeding
  if (!user || !profileUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const userRecipes = recipes.filter((recipe) => recipe.authorId === user._id);
  const savedRecipes = recipes.filter((recipe) => recipe.isSaved);
  
  const defaultAddress = addresses.find(a => a.isDefault);
  const defaultPaymentMethod = paymentMethods.find(p => p.isDefault);
  const recentOrders = orders.slice(0, 3);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: () => {
            logout();
            router.replace("/(auth)");
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    if (!user) return;
    
    router.push({
      pathname: "/profile/edit",
      params: { userId: user._id },
    });
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleFollowUser = async () => {
    if (!profileUser) return;
    
    try {
      setIsLoadingProfile(true);
      
      // Toggle follow state
      setProfileUser(prev => ({
        ...prev!,
        followers: isFollowingUser 
          ? Math.max(0, (prev?.followers || 1) - 1) 
          : (prev?.followers || 0) + 1
      }));
      
      setIsFollowingUser(!isFollowingUser);
      
      // Here you would typically make an API call to update follow status
      // await api.followUser(profileUser._id);
      
    } catch (error) {
      console.error('Error toggling follow status:', error);
      // Revert on error
      setProfileUser(prev => ({
        ...prev!,
        followers: isFollowingUser 
          ? (prev?.followers || 0) + 1
          : Math.max(0, (prev?.followers || 1) - 1)
      }));
      setIsFollowingUser(isFollowingUser);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleViewFollowers = () => {
    router.push("/profile/followers");
  };

  const handleViewFollowing = () => {
    router.push("/profile/following");
  };

  const handleFollowToggle = () => {
    handleFollowUser();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleSettings}>
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <LogOut size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profileUser?.avatar || 'https://via.placeholder.com/150' }}
            style={styles.profileImage}
            contentFit="cover"
            transition={200}
          />
          <Text style={styles.profileName}>
            {user.firstName} {user.lastName}
          </Text>
          {profileUser?.location && (
            <Text style={styles.profileLocation}>
              <Ionicons name="location-outline" size={14} color={colors.text} /> {profileUser.location}
            </Text>
          )}
          {profileUser?.bio && <Text style={styles.profileBio}>{profileUser.bio}</Text>}

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text style={styles.statNumber}>{userRecipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={handleViewFollowers}
            >
              <Text style={styles.statNumber}>{profileUser?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={handleViewFollowing}
            >
              <Text style={styles.statNumber}>{profileUser?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Edit2 size={16} color={colors.text} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            
            {profileUser && profileUser._id !== user._id && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowingUser && styles.unfollowButton
                ]}
                onPress={handleFollowToggle}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={isFollowingUser ? colors.text : colors.white} />
                ) : (
                  <>
                    {isFollowingUser ? (
                      <UserMinus size={16} color={colors.text} />
                    ) : (
                      <UserPlus size={16} color={colors.white} />
                    )}
                    <Text style={[
                      styles.followButtonText,
                      isFollowingUser && styles.unfollowButtonText
                    ]}>
                      {isFollowingUser ? "Unfollow" : "Follow"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/orders")}
          >
            <View style={styles.menuItemLeft}>
              <ShoppingBag size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>My Orders</Text>
            </View>
            <ChevronRight size={20} color={colors.lightText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/addresses")}
          >
            <View style={styles.menuItemLeft}>
              <MapPin size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>My Addresses</Text>
            </View>
            <ChevronRight size={20} color={colors.lightText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/payment")}
          >
            <View style={styles.menuItemLeft}>
              <CreditCard size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>Payment Methods</Text>
            </View>
            <ChevronRight size={20} color={colors.lightText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/chatbot")}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.chatbotIcon}>
                <Text style={styles.chatbotIconText}>🍲</Text>
              </View>
              <Text style={styles.menuItemText}>AI Cuisine Assistant</Text>
            </View>
            <ChevronRight size={20} color={colors.lightText} />
          </TouchableOpacity>
        </View>
        
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push("/profile/orders")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderItem}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle}>Order #{order.id.slice(-4)}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.orderStatus}>
                  <Text
                    style={[
                      styles.orderStatusText,
                      order.status === "delivered" && styles.deliveredStatus,
                      order.status === "cancelled" && styles.cancelledStatus,
                    ]}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/-/g, " ")}
                  </Text>
                  <ChevronRight size={16} color={colors.lightText} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "recipes" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("recipes")}
          >
            <Grid
              size={20}
              color={
                activeTab === "recipes" ? colors.primary : colors.lightText
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "recipes" && styles.activeTabText,
              ]}
            >
              My Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "saved" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("saved")}
          >
            <Bookmark
              size={20}
              color={activeTab === "saved" ? colors.primary : colors.lightText}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "saved" && styles.activeTabText,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recipesContainer}>
          {activeTab === "recipes" &&
            (userRecipes.length > 0 ? (
              userRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No recipes yet</Text>
                <Text style={styles.emptyStateText}>
                  Create your first recipe to share with the community
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push("/create-recipe")}
                >
                  <Text style={styles.createButtonText}>Create Recipe</Text>
                </TouchableOpacity>
              </View>
            ))}

          {activeTab === "saved" &&
            (savedRecipes.length > 0 ? (
              savedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No saved recipes</Text>
                <Text style={styles.emptyStateText}>
                  Save recipes to access them later
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push("/search")}
                >
                  <Text style={styles.createButtonText}>Explore Recipes</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </ScrollView>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  iconButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    ...typography.heading2,
    marginBottom: 4,
  },
  profileLocation: {
    ...typography.bodySmall,
    color: colors.lightText,
    marginBottom: 12,
  },
  profileBio: {
    ...typography.body,
    textAlign: "center",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    ...typography.heading3,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightText,
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: colors.divider,
  },
  profileActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  editProfileText: {
    ...typography.bodySmall,
    marginLeft: 8,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  unfollowButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  followButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    marginLeft: 8,
  },
  unfollowButtonText: {
    color: colors.text,
  },
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: 16,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    ...typography.body,
    marginLeft: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  orderDate: {
    ...typography.caption,
    color: colors.lightText,
  },
  orderStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderStatusText: {
    ...typography.caption,
    color: colors.info,
    marginRight: 4,
  },
  deliveredStatus: {
    color: colors.success,
  },
  cancelledStatus: {
    color: colors.error,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.cardBackground,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.lightText,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
  },
  recipesContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    ...typography.heading3,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightText,
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    ...typography.button,
    color: colors.white,
  },
  chatbotIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatbotIconText: {
    fontSize: 18,
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
    flexDirection: 'row',
    zIndex: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
