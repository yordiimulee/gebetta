import AddressForm from "../components/AddressForm";
import { useProfileStore } from "@/store/profileStore";
import { useRouter } from "expo-router";
import React from "react";
import { AddressFormData } from "@/types/address-form";

export default function AddAddressScreen() {
  const router = useRouter();
  const { addAddress } = useProfileStore();

  const handleSubmit = async (data: AddressFormData) => {
    try {
      const { useAuthStore } = await import('@/store/useAuthStore');
      const { user } = useAuthStore.getState();
      
      if (!user?.token) {
        console.error('No auth token found');
        return;
      }

      // Map form data to API structure
      const newAddress = {
        name: data.street, // Use street as name
        label: data.customLabel && data.label === 'other' ? data.customLabel : data.label,
        additionalInfo: data.city, // Use city as additional info
        isDefault: data.isDefault || false,
        coordinates: { lat: 9.03, lng: 38.74 } // Default coordinates for now
      };
      
      await addAddress(newAddress, user.token);
      // Navigate back to addresses list safely
      router.replace('/profile/addresses');
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  return (
    <AddressForm
      initialData={{
        street: '',
        city: '',
        label: 'home',
        isDefault: false,
        customLabel: '',
      }}
      onSubmit={handleSubmit}
    />
  );
}
