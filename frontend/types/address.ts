export type AddressType = {
  id: string;
  street: string;
  city: string;
  label: 'home' | 'work' | 'other';
  customLabel?: string;
  isDefault: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
