export type AddressType = {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  label: 'home' | 'work' | 'other';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
