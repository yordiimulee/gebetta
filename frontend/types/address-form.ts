export type AddressFormData = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  label: 'home' | 'work' | 'other';
  isDefault: boolean;
};

export interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  initialData?: AddressFormData;
}
