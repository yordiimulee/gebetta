import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AddressType } from '@/types/address';
import { Home, Office, Edit2, X, Check } from 'lucide-react-native';

interface AddressCardProps {
  address: AddressType;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const IconMap = {
    home: <Home size={24} color="#666" />,
    work: <Office size={24} color="#666" />,
    other: <></>,
  };

  const labelMap = {
    home: 'Home',
    work: 'Work',
    other: 'Other',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {IconMap[address.label]}
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{labelMap[address.label]}</Text>
          {address.isDefault && (
            <Text style={styles.defaultBadge}>Default</Text>
          )}
        </View>
      </View>
      
      <View style={styles.addressContainer}>
        <Text style={styles.address}>{address.street}</Text>
        <Text style={styles.address}>{`${address.city}, ${address.state} ${address.postalCode}`}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
        >
          <Edit2 size={16} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <X size={16} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
        
        {!address.isDefault && (
          <TouchableOpacity
            style={[styles.actionButton, styles.defaultButton]}
            onPress={onSetDefault}
          >
            <Check size={16} color="#fff" />
            <Text style={styles.actionText}>Set Default</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  addressContainer: {
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  defaultButton: {
    backgroundColor: '#2196F3',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
