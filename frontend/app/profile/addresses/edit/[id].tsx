import AddressForm from "../components/AddressForm";
import { useProfileStore } from "@/store/profileStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AddressFormData } from "@/types/address-form";
import { AddressType } from "@/types/address";
import React from "react";

export default function EditAddressScreen() {
  const router = useRouter();
  const { addresses, editAddress } = useProfileStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const address = addresses?.find(addr => addr.id === id);

  if (!address) {
    router.back();
    return null;
  }

  const handleSubmit = (data: AddressFormData) => {
    // Only update the fields that are part of the AddressType
    const updatedAddress: Partial<Omit<AddressType, 'id' | 'createdAt' | 'updatedAt'>> = {
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      label: data.label,
      customLabel: data.customLabel,
      isDefault: data.isDefault
    };
    
    editAddress(id, updatedAddress);
    router.back();
  };

  return (
    <AddressForm
      initialData={{
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        label: address.label,
        customLabel: address.customLabel,
        isDefault: address.isDefault
      }}
      onSubmit={handleSubmit}
    />
  );
}
