// src/screens/settings/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import CustomAlert from '../../Components/Common/CustomAlert';

// Services
import { authService } from '../../Shared/strapiService';

const SettingsScreen = ({ navigation }) => {
  // États pour les paramètres
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // État pour le modal de changement de mot de passe
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  // Charger les données utilisateur et les préférences
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserData(user);

        // Charger les préférences depuis AsyncStorage
        const storedNotifications = await AsyncStorage.getItem('notifications_enabled');
        const storedDarkMode = await AsyncStorage.getItem('dark_mode_enabled');
        const storedEmailNotifs = await AsyncStorage.getItem('email_notifications');

        setNotificationsEnabled(storedNotifications === 'true');
        setDarkModeEnabled(storedDarkMode === 'true');
        setEmailNotifications(storedEmailNotifs !== 'false'); // Par défaut activé
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Gérer les changements de paramètres
  const handleNotificationsToggle = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
    // Ici, vous pourriez aussi appeler une API pour mettre à jour les préférences côté serveur
  };

  const handleDarkModeToggle = async (value) => {
    setDarkModeEnabled(value);
    await AsyncStorage.setItem('dark_mode_enabled', value.toString());
    // Vous pourriez implémenter un système de thème sombre ici
  };

  const handleEmailNotificationsToggle = async (value) => {
    setEmailNotifications(value);
    await AsyncStorage.setItem('email_notifications', value.toString());
    // Appel API pour mettre à jour les préférences d'email
  };

  // Déconnexion
  // const handleLogout = async () => {
  //   Alert.alert(
  //     'Déconnexion',
  //     'Êtes-vous sûr de vouloir vous déconnecter ?',
  //     [
  //       { text: 'Annuler', style: 'cancel' },
  //       { 
  //         text: 'Déconnexion', 
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //             await authService.logout();
  //             // Rediriger vers l'écran de connexion
  //             navigation.reset({
  //               index: 0,
  //               routes: [{ name: 'Login' }],
  //             });
  //           } catch (error) {
  //             console.error('Erreur lors de la déconnexion:', error);
  //             Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
  //           }
  //         }
  //       }
  //     ]
  //   );
  // };
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
          routes: [{ name: 'Login' }],
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

  // Changer le mot de passe
  const handleChangePassword = async () => {
    // Validation basique
    if (!currentPassword) {
      setPasswordError('Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (!newPassword) {
      setPasswordError('Veuillez entrer un nouveau mot de passe');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError('');

    try {
      // Appelez votre API pour changer le mot de passe
      // Cette fonction n'est pas implémentée dans le service fourni, vous devrez l'ajouter
      await authService.changePassword(currentPassword, newPassword);

      // Fermer le modal et réinitialiser les champs
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);

      if (error.response && error.response.status === 401) {
        setPasswordError('Mot de passe actuel incorrect');
      } else {
        setPasswordError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Supprimer le compte
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation',
              'Toutes vos données seront perdues. Veuillez confirmer cette action.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer la suppression',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Fonction à implémenter dans votre service
                      // await authService.deleteAccount();

                      // Déconnexion et redirection
                      await authService.logout();
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    } catch (error) {
                      console.error('Erreur lors de la suppression du compte:', error);
                      Alert.alert('Erreur', 'Impossible de supprimer le compte. Veuillez réessayer.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  // Modal de changement de mot de passe
  const renderPasswordModal = () => (
    <Modal
      visible={passwordModalVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setPasswordModalVisible(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }}
            >
              <Icon name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe actuel"
              placeholderTextColor={COLORS.darkGray}
              secureTextEntry={!showPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={COLORS.darkGray}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={COLORS.darkGray}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.visibilityIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={COLORS.darkGray}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Rendu principal
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des paramètres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Paramètres</Text>

        <View style={styles.rightPlaceholder}></View>
      </View>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil utilisateur */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitials}>
              {userData?.firstName?.charAt(0) || ''}
              {userData?.lastName?.charAt(0) || ''}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {`${userData?.firstName || ''} ${userData?.lastName || ''}`}
            </Text>
            <Text style={styles.userEmail}>{userData?.email || ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Paramètres de notifications */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="notifications-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Notifications push</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.gray}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="mail-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Notifications par email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={handleEmailNotificationsToggle}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={emailNotifications ? COLORS.primary : COLORS.gray}
            />
          </View>
        </View>

        {/* Paramètres d'affichage */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Affichage</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="moon-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Mode sombre</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={darkModeEnabled ? COLORS.primary : COLORS.gray}
            />
          </View>
        </View>

        {/* Paramètres de sécurité */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Sécurité</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.settingInfo}>
              <Icon name="lock-closed-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Changer le mot de passe</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Paramètres de l'application */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Application</Text>

          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <Icon name="information-circle-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>À propos</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <Icon name="help-circle-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Aide et support</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <Icon name="document-text-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingInfo}>
              <Icon name="shield-checkmark-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Politique de confidentialité</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Actions de compte */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Compte</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleLogout}
          >
            <View style={styles.settingInfo}>
              <Icon name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={[styles.settingLabel, { color: COLORS.error }]}>Se déconnecter</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingInfo}>
              <Icon name="trash-outline" size={22} color={COLORS.error} />
              <Text style={[styles.settingLabel, { color: COLORS.error }]}>Supprimer mon compte</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version de l'application */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modal de changement de mot de passe */}
      {renderPasswordModal()}

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
  container: {
    flex: 1,
    padding: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  rightPlaceholder: {
    width: 24, // Pour maintenir l'équilibre avec le bouton de retour
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.xl,
    ...NEUMORPHISM.light,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  userInitials: {
    ...FONTS.h2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  userEmail: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginLeft: SIZES.md,
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: SIZES.xl,
  },
  versionText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    ...NEUMORPHISM.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SIZES.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  inputIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    height: 50,
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  visibilityIcon: {
    padding: SIZES.xs,
  },
  errorText: {
    ...FONTS.body2,
    color: COLORS.error,
    marginBottom: SIZES.md,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.md,
  },
  saveButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default SettingsScreen;