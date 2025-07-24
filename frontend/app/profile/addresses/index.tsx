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
  // Home addresses
  {
    id: 'home-1',
    street: 'Bole Road, House #123',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'home',
    isDefault: true,
    note: 'Main residence - 3rd floor, Ring Road',
    createdAt: '2025-01-15T08:30:00.000Z',
    updatedAt: '2025-06-20T14:25:00.000Z'
  },
  {
    id: 'home-2',
    street: 'Megenagna, Condo #4B',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'home',
    isDefault: false,
    note: 'Weekend house - Near Friendship Center',
    createdAt: '2024-11-05T10:15:00.000Z',
    updatedAt: '2025-05-12T16:45:00.000Z'
  },
  // Work addresses
  {
    id: 'work-1',
    street: 'Kazanchis Business District, 5th Floor',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'work',
    isDefault: false,
    note: 'EthioTech Solutions HQ - Reception on 1st floor',
    createdAt: '2024-09-10T09:00:00.000Z',
    updatedAt: '2025-06-18T11:30:00.000Z'
  },
  {
    id: 'work-2',
    street: 'CMC Road, Building #42',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'work',
    isDefault: false,
    note: 'Client site - Ask for security at main gate',
    createdAt: '2025-02-20T13:45:00.000Z',
    updatedAt: '2025-06-22T10:15:00.000Z'
  },
  {
    id: 'work-3',
    street: 'Bole Road, Dembel City Center, 7th Floor',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'work',
    isDefault: false,
    note: 'Co-working space - Available 24/7 with access card',
    createdAt: '2025-04-05T08:00:00.000Z',
    updatedAt: '2025-06-21T17:30:00.000Z'
  },
  // Other addresses
  {
    id: 'other-1',
    street: 'Sarbet District, Near Edna Mall',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'other',
    isDefault: false,
    note: 'Spa & Wellness Center - Open 9AM-9PM',
    createdAt: '2024-10-15T07:30:00.000Z',
    updatedAt: '2025-06-19T19:45:00.000Z'
  },
  {
    id: 'other-2',
    street: 'Bole Atlas, Behind DH Geda Tower',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'other',
    isDefault: false,
    note: 'Friend\'s apartment - Call before visiting',
    createdAt: '2025-03-12T16:20:00.000Z',
    updatedAt: '2025-06-17T20:15:00.000Z'
  },
  {
    id: 'other-3',
    street: '4 Kilo, Arat Kilo Cultural Center',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postalCode: '1000',
    label: 'other',
    isDefault: false,
    note: 'Weekly coffee meetup - Every Saturday 4PM',
    createdAt: '2025-01-30T10:00:00.000Z',
    updatedAt: '2025-06-23T15:30:00.000Z'
  }
];

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, removeAddress, setDefaultAddress, addAddress } = useProfileStore();
  const [isLoading, setIsLoading] = useState(true);
  const [displayAddresses, setDisplayAddresses] = useState<AddressType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Initialize with mock data if no addresses exist
        if (addresses.length === 0) {
          console.log('Initializing with mock addresses');
          // Clear any existing addresses first to avoid duplicates
          addresses.forEach(addr => removeAddress(addr.id));
          // Add all mock addresses
          mockAddresses.forEach(address => addAddress(address));
          setDisplayAddresses(mockAddresses);
        } else {
          console.log('Using existing addresses:', addresses);
          setDisplayAddresses([...addresses]);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [addresses.length, addAddress, removeAddress]);

  // Group addresses by label
  const groupedAddresses = displayAddresses.reduce<GroupedAddresses>((acc, address) => {
    const label = address.label.toLowerCase();
    console.log(`Processing address:`, { id: address.id, label, street: address.street });
    if (!acc[label]) {
      console.log(`Creating new group for label: ${label}`);
      acc[label] = [];
    }
    acc[label].push(address);
    console.log(`Added to group ${label}:`, address.street);
    return acc;
  }, {});

  console.log('Grouped addresses:', Object.keys(groupedAddresses));
  console.log('Display addresses:', displayAddresses.map(a => ({ id: a.id, label: a.label, street: a.street })));

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
