// src/screens/profile/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import { API_URL, authService } from '../../Shared/strapiService';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../../Components/Common/CustomAlert';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    emailUpdates: true,
    language: 'fr',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutAlertVisible(true);
  };

  const performLogout = async () => {
    try {
      await authService.logout();

      if (Platform.OS === 'web') {
        // Sur le web, forcez le rechargement pour vérifier l'authentification
        window.location.reload();
      } else {
        // Sur mobile, utilisez la navigation React Native
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      if (Platform.OS === 'web') {
        window.alert('Impossible de se déconnecter');
      } else {
        Alert.alert('Erreur', 'Impossible de se déconnecter');
      }
    }
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre autorisation pour accéder à votre galerie'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUpdating(true);

        try {
          // Créer un objet FormData pour le téléchargement de l'image
          const formData = new FormData();
          formData.append('files', {
            uri: result.assets[0].uri,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          });

          // Télécharger l'image sur le serveur
          const token = await AsyncStorage.getItem('jwt_token');
          const uploadResponse = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult && uploadResult.length > 0) {
            // Mettre à jour l'avatar de l'utilisateur
            await authService.updateUser({
              avatar: uploadResult[0].id,
            });

            // Recharger le profil
            await loadUserProfile();
          }
        } catch (uploadError) {
          console.error('Erreur lors du téléchargement de l\'avatar:', uploadError);
          Alert.alert('Erreur', 'Impossible de mettre à jour l\'avatar');
        } finally {
          setUpdating(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
    }
  };

  const handleUpdateField = async () => {
    if (!editField) return;

    try {
      setUpdating(true);

      const updateData = {
        [editField]: editValue,
      };

      await authService.updateUser(updateData);
      await loadUserProfile();

      setEditMode(false);
      setEditField(null);
      setEditValue('');

      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setUpdating(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings({
      ...settings,
      [setting]: value,
    });
  };

  const renderEditModal = () => (
    <Modal
      visible={editMode}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditMode(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Modifier {editField === 'email' ? 'Email' :
                editField === 'phone' ? 'Téléphone' :
                  editField === 'bio' ? 'Bio' : 'Information'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setEditMode(false);
                setEditField(null);
                setEditValue('');
              }}
            >
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={[
                styles.editInput,
                editField === 'bio' && styles.editTextarea
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Entrez votre ${editField === 'email' ? 'email' :
                editField === 'phone' ? 'téléphone' :
                  editField === 'bio' ? 'bio' : 'information'}`}
              placeholderTextColor={COLORS.darkGray}
              multiline={editField === 'bio'}
              keyboardType={editField === 'email' ? 'email-address' :
                editField === 'phone' ? 'phone-pad' : 'default'}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateField}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.updateButtonText}>Mettre à jour</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Rendu d'un champ de profil
  const renderProfileField = (label, value, field = null) => (
    <TouchableOpacity
      style={styles.profileField}
      onPress={() => {
        if (field) {
          setEditField(field);
          setEditValue(value || '');
          setEditMode(true);
        }
      }}
      disabled={!field}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueContainer}>
        <Text style={styles.fieldValue}>
          {value || 'Non spécifié'}
        </Text>
        {field && (
          <Icon name="chevron-forward" size={20} color={COLORS.darkGray} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Rendu d'un paramètre
  const renderSetting = (label, setting, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Icon name={icon} size={20} color={COLORS.primary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={settings[setting]}
        onValueChange={(value) => handleSettingChange(setting, value)}
        trackColor={{ false: COLORS.lightGray, true: COLORS.primary + '80' }}
        thumbColor={settings[setting] ? COLORS.primary : COLORS.white}
        ios_backgroundColor={COLORS.lightGray}
      />
    </View>
  );

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profil</Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickAvatar}
          >
            {updating ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.editAvatarButton}>
              <Icon name="camera" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          {renderProfileField('Nom d\'utilisateur', user?.username)}
          {renderProfileField('Email', user?.email, 'email')}
          {renderProfileField('Téléphone', user?.phone, 'phone')}
          {renderProfileField('Bio', user?.bio, 'bio')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          {renderSetting('Notifications', 'notifications', 'notifications')}
          {renderSetting('Mode sombre', 'darkMode', 'moon')}
          {renderSetting('Mises à jour par email', 'emailUpdates', 'mail')}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out" size={20} color={COLORS.white} />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderEditModal()}

      <CustomAlert
        visible={logoutAlertVisible}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        onCancel={() => setLogoutAlertVisible(false)}
        onConfirm={() => {
          setLogoutAlertVisible(false);
          performLogout();
        }}
        cancelText="Annuler"
        confirmText="Déconnexion"
        destructive={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.white,
    flex: 1,
    marginLeft: SIZES.md,
    textAlign: 'center',
  },
  settingsButton: {
    padding: SIZES.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.h1,
    color: COLORS.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  username: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  email: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SIZES.xl,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    ...NEUMORPHISM.light,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  profileField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  fieldLabel: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValue: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginRight: SIZES.xs,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEUMORPHISM.light,
  },
  logoutButtonText: {
    ...FONTS.h4,
    color: COLORS.primary,
    marginLeft: SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.lg,
    width: '90%',
    ...NEUMORPHISM.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    padding: SIZES.lg,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  formContainer: {
    padding: SIZES.lg,
  },
  editInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.lg,
  },
  editTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default ProfileScreen;