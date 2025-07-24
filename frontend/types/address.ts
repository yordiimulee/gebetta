export type AddressType = {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  label: 'home' | 'work' | 'other';
  isDefault: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
