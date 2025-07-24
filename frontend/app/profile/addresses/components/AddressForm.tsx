import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AddressFormData, AddressFormProps } from '../../../../types/address-form';
import { Picker } from '@react-native-picker/picker';
import type { AddressType } from '../../../../types/address';

interface Styles {
  container: ViewStyle;
  title: TextStyle;
  input: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  picker: TextStyle;
  pickerContainer: ViewStyle;
  pickerLabel: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
}



export function AddressForm({ onSubmit, initialData }: AddressFormProps) {
  const addressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal Code is required'),
    label: z.enum(['home', 'work', 'other']),
    isDefault: z.boolean()
  }) as any;

  const { control, handleSubmit, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      label: 'home',
      isDefault: false
    } as AddressFormData,
  });

  const handleSave = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Address</Text>
      <Controller
        control={control}
        name="street"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Street"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="City"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="state"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="State"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="postalCode"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Postal Code"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="label"
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              <Picker.Item label="Home" value="home" />
              <Picker.Item label="Work" value="work" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>Save Address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles: Styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center' as 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold' as 'bold',
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    marginVertical: 10,
  },
  pickerLabel: {
    textAlign: 'left' as 'left',
    padding: 15,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center' as 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold' as 'bold',
    fontSize: 16,
  },
});

export default AddressForm;
