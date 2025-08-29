import AddressForm from "../components/AddressForm";
import { useProfileStore } from "@/store/profileStore";
import { useRouter } from "expo-router";
import React from "react";
import { AddressFormData } from "@/types/address-form";

export default function AddAddressScreen() {
  const router = useRouter();
  const { addAddress } = useProfileStore();

  const handleSubmit = (data: AddressFormData) => {
    // Create address object matching the expected type Omit<AddressType, 'id' | 'createdAt' | 'updatedAt'>
    const newAddress = {
      street: data.street,
      city: data.city,
      label: data.label,
      isDefault: data.isDefault || false,
      ...(data.customLabel && { customLabel: data.customLabel })
    };
    
    addAddress(newAddress);
    router.back();
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
