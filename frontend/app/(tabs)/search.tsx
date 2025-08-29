import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Settings, ChevronDown, ShoppingBag, Search, X } from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/constants/colors";
import typography from "@/constants/typography";
import SearchBar from "@/components/SearchBar";
import RecipeCard from "@/components/RecipeCard";
import CategoryPill from "@/components/CategoryPill";
import { useRecipeStore } from "@/store/recipeStore";
import { useCartStore } from "@/store/cartStore";
import { popularTags, regions, difficulties } from "@/mocks/recipes";

type SortOption = {
  label: string;
  value: string;
};

const sortOptions: SortOption[] = [
  { label: "Most Popular", value: "popular" },
  { label: "Highest Rated", value: "rating" },
  { label: "Newest", value: "newest" },
  { label: "Cooking Time", value: "time" },
];

export default function SearchScreen() {
  const router = useRouter();

  const {
    recipes,
    filteredRecipes,
    selectedTag,
    selectedRegion,
    searchQuery,
    setSelectedTag,
    setSelectedRegion,
    setSearchQuery,
    sortRecipes,
    filterByDifficulty,
    filterByTime,
  } = useRecipeStore();

  const { getCartItemsCount } = useCartStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>("popular");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const { width } = Dimensions.get("window");
  const isTablet = width > 768;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const resultsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Apply sorting when selected option changes
    sortRecipes(selectedSort);
  }, [selectedSort, sortRecipes]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate results when they change
  useEffect(() => {
    resultsAnim.setValue(0);
    Animated.timing(resultsAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [filteredRecipes]);

  // Animate filters
  useEffect(() => {
    if (showFilters) {
      Animated.timing(filterAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      filterAnim.setValue(0);
    }
  }, [showFilters]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(selectedRegion === region ? null : region);
  };

  const handleDifficultySelect = (difficulty: string) => {
    const newDifficulty = selectedDifficulty === difficulty ? null : difficulty;
    setSelectedDifficulty(newDifficulty);
    filterByDifficulty(newDifficulty);
  };

  const handleTimeSelect = (time: number | null) => {
    setMaxTime(time);
    filterByTime(time);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
    if (showFilters) setShowFilters(false);
  };

  const handleSortSelect = (sortValue: string) => {
    setSelectedSort(sortValue);
    setShowSortOptions(false);
  };

  const clearAllFilters = () => {
    setSelectedTag(null);
    setSelectedRegion(null);
    setSelectedDifficulty(null);
    setMaxTime(null);
    setSearchQuery("");
    filterByDifficulty(null);
    filterByTime(null);
  };

  const getSelectedSortLabel = () => {
    return sortOptions.find((option) => option.value === selectedSort)?.label;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Search Header */}
      <Animated.View
        style={[
          styles.searchHeader,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.searchContainer}>
          <View style={styles.searchBarCustom}>
            <Search size={20} color={colors.lightText} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for delicious recipes..."
              placeholderTextColor={colors.lightText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <X size={18} color={colors.lightText} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (selectedTag || selectedRegion || selectedDifficulty || maxTime) ? styles.activeFilterButton : {},
          ]}
          onPress={toggleFilters}
        >
          <FontAwesome5
            name="filter"
            size={20}
            color={
              selectedTag || selectedRegion || selectedDifficulty || maxTime
                ? colors.white
                : colors.text
            }
          />
        </TouchableOpacity>
      </Animated.View>

      {showFilters && (
        <Animated.View
          style={[
            styles.filtersContainer,
            {
              opacity: filterAnim,
              transform: [
                {
                  translateY: filterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Categories</Text>
              {selectedTag && (
                <TouchableOpacity onPress={() => setSelectedTag(null)}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContainer}
            >
              {popularTags.map((tag) => (
                <CategoryPill
                  key={tag}
                  title={tag}
                  selected={selectedTag === tag}
                  onPress={() => handleTagSelect(tag)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Regions</Text>
              {selectedRegion && (
                <TouchableOpacity onPress={() => setSelectedRegion(null)}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContainer}
            >
              {regions.map((region) => (
                <CategoryPill
                  key={region}
                  title={region}
                  selected={selectedRegion === region}
                  onPress={() => handleRegionSelect(region)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Difficulty</Text>
              {selectedDifficulty && (
                <TouchableOpacity
                  onPress={() => handleDifficultySelect(selectedDifficulty)}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.difficultyContainer}>
              {difficulties.map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.difficultyButton,
                    selectedDifficulty === difficulty &&
                      styles.selectedDifficultyButton,
                  ]}
                  onPress={() => handleDifficultySelect(difficulty)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      selectedDifficulty === difficulty &&
                        styles.selectedDifficultyButtonText,
                    ]}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Cooking Time</Text>
              {maxTime && (
                <TouchableOpacity onPress={() => handleTimeSelect(null)}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.timeContainer}>
              {[30, 60, 90, 120].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    maxTime === time && styles.selectedTimeButton,
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      maxTime === time && styles.selectedTimeButtonText,
                    ]}
                  >
                    {time === 120 ? "2+ hours" : `${time} min`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort By</Text>
            <View style={styles.sortOptionsContainer}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    selectedSort === option.value && styles.selectedSortOption,
                  ]}
                  onPress={() => {
                    setSelectedSort(option.value);
                    sortRecipes(option.value);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      selectedSort === option.value && styles.selectedSortOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearAllText}>🗑️ Clear All Filters</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {filteredRecipes.length > 0 ? (
        <Animated.View
          style={[
            styles.resultsContainer,
            {
              opacity: resultsAnim,
              transform: [
                {
                  translateY: resultsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >

          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            contentContainerStyle={styles.recipesList}
            showsVerticalScrollIndicator={false}
            numColumns={1}
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.emptyContainer,
            {
              opacity: resultsAnim,
              transform: [{ scale: resultsAnim }],
            },
          ]}
        >
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search or filters to find what you're looking for
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.retryButtonText}>🔄 Clear Filters & Try Again</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Enhanced Floating Cart Button */}
      {getCartItemsCount() > 0 && (
        <Animated.View
          style={[
            styles.floatingCartButton,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cartButtonContent}
            onPress={() => router.push("/cart")}
          >
            <ShoppingBag size={24} color={colors.white} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartItemsCount()}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    zIndex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.white,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchBarCustom: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    padding: 0,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterSortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  filterButton: {
    width: 48,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    elevation: 6,
    shadowOpacity: 0.2,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    marginLeft: 8,
  },
  sortButtonText: {
    ...typography.bodySmall,
    marginHorizontal: 8,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSortOption: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  selectedSortOptionText: {
    color: colors.white,
    fontWeight: "600",
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filterTitle: {
    ...typography.heading4,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
  },
  selectedDifficultyButton: {
    backgroundColor: colors.primary,
  },
  difficultyButtonText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  selectedDifficultyButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
  },
  selectedTimeButton: {
    backgroundColor: colors.primary,
  },
  timeButtonText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  selectedTimeButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  clearAllButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  clearAllText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
  recipesList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.heading3,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.lightText,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  cartButton: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: "600",
  },
  floatingCartButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 10,
  },
  cartButtonContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
