import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/store/profileStore';
import { AddressType } from '@/types/address';
import colors from '@/constants/colors';
import typography from '@/constants/typography';
import Button from '@/components/Button';

type GroupedAddresses = {
  [key: string]: AddressType[];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading2,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightText,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text,
    marginTop: 16,
  },
  addButton: {
    margin: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

// Mock addresses to be used if none exist in the store
const mockAddresses: AddressType[] = [
  {
    id: '1',
    street: 'Bole Road',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'home',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    street: 'Kazanchis Business District',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'work',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    street: 'Sarbet',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'other',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, removeAddress, setDefaultAddress, addAddress } = useProfileStore();
  const [isLoading, setIsLoading] = useState(true);
  const [displayAddresses, setDisplayAddresses] = useState<AddressType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Initialize with mock data if no addresses exist
      if (addresses.length === 0) {
        mockAddresses.forEach(address => addAddress(address));
        setDisplayAddresses(mockAddresses);
      } else {
        setDisplayAddresses(addresses);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [addresses.length]);

  // Group addresses by label
  const groupedAddresses = displayAddresses.reduce<GroupedAddresses>((acc, address) => {
    const label = address.label.toLowerCase();
    if (!acc[label]) {
      acc[label] = [];
    }
    acc[label].push(address);
    return acc;
  }, {});

  const handleAddAddress = () => {
    router.push("/profile/addresses/add");
  };

  const handleEditAddress = (id: string) => {
    router.push(`/profile/addresses/edit/${id}`);
  };

  const handleRemoveAddress = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => removeAddress(id)
        }
      ]
    );
  };

  const handleSetDefaultAddress = (id: string) => {
    Alert.alert(
      "Set as Default",
      "Do you want to set this as your default address?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Set as Default",
          onPress: () => setDefaultAddress(id)
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }
  const getAddressIcon = (label: string): keyof typeof MaterialIcons.glyphMap => {
    switch (label.toLowerCase()) {
      case 'home':
        return 'home';
      case 'work':
        return 'work';
      default:
        return 'location-on';
    }
  };

  // Get display name for address label
  const getLabelDisplayName = (label: string): string => {
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.title}>My Addresses</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>My Addresses</Text>
      </View>

      {displayAddresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="location-off"
            size={48}
            color={colors.lightText}
            style={styles.emptyIcon}
          />
          <Text style={[typography.h6, { color: colors.text, marginBottom: 8 }]}>
            No Saved Addresses
          </Text>
          <Text style={styles.emptyText}>
            You haven't saved any addresses yet. Add your first address to get started.
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {Object.entries(groupedAddresses).map(([label, addresses]) => {
            const labelDisplayName = getLabelDisplayName(label);
            const labelIcon = getAddressIcon(label);
            
            return (
              <View key={label} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialIcons 
                    name={labelIcon} 
                    size={20} 
                    color={colors.primary} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[typography.subtitle1, { color: colors.text }]}>
                    {labelDisplayName}
                  </Text>
                </View>
                
                {addresses.map((address) => (
                  <View 
                    key={address.id} 
                    style={[
                      {
                        backgroundColor: colors.white,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: address.isDefault ? colors.primary : colors.border,
                      },
                      address.isDefault && {
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary,
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[typography.subtitle2, { color: colors.text }]}>
                        {address.street}
                      </Text>
                      {address.isDefault && (
                        <View 
                          style={{
                            backgroundColor: colors.primary + '20', // Add transparency
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={[typography.caption, { color: colors.primary }]}>
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[typography.body2, { color: colors.lightText, marginTop: 4 }]}>
                      {`${address.city}, ${address.state} ${address.postalCode}`}
                    </Text>
                    
                    <View 
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        marginTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingTop: 12
                      }}
                    >
                      <TouchableOpacity 
                        style={{ marginRight: 16 }}
                        onPress={() => handleEditAddress(address.id)}
                      >
                        <Text style={{ color: colors.primary }}>Edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={{ marginRight: 16 }}
                        onPress={() => handleSetDefaultAddress(address.id)}
                        disabled={address.isDefault}
                      >
                        <Text style={{ 
                          color: address.isDefault ? colors.lightText : colors.primary 
                        }}>
                          {address.isDefault ? 'Default' : 'Set as Default'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity onPress={() => handleRemoveAddress(address.id)}>
                        <Text style={{ color: colors.error }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
      
      <View style={styles.footer}>
        <Button 
          title="Add New Address" 
          onPress={handleAddAddress}
          style={styles.addButton}
        />
      </View>
    </SafeAreaView>
  );
}
