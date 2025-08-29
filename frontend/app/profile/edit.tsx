import Button from "@/components/Button";
import Input from "@/components/Input";
import colors from "@/constants/colors";
import typography from "@/constants/typography";
import { useAuthStore } from "@/store/authStore";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  
  const [firstName, setFirstName] = useState((user as any)?.firstName || "");
  const [lastName, setLastName] = useState((user as any)?.lastName || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!firstName.trim()) {
      Alert.alert("Error", "First name is required");
      return;
    }
    
    if (!lastName.trim()) {
      Alert.alert("Error", "Last name is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      updateProfile({
        firstName,
        lastName,
        avatar,
      } as any);
      
      Alert.alert(
        "Success",
        "Profile updated successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar || "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200" }}
            style={styles.avatar}
            contentFit="cover"
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={pickImage}
          >
            <Text style={{ color: colors.white, fontSize: 16 }}>📷</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <Input
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          
          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isSubmitting}
            variant="primary"
            fullWidth
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.heading3,
  },
  scrollContent: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  saveButton: {
    marginTop: 16,
  },
});
