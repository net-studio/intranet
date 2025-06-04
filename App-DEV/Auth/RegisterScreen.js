// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { authService } from '../Shared/strapiService';

const RegisterScreen = ({ navigation }) => {
  // console.log('authService disponible:', authService);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validation du prénom
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
      isValid = false;
    }

    // Validation du nom
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
      isValid = false;
    }

    // Validation de l'email
    if (!email || !email.trim()) {
      newErrors.email = 'L\'email est requis';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
      isValid = false;
    }

    // Validation du mot de passe
    if (!password || !password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      isValid = false;
    }

    // Validation de la confirmation du mot de passe
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      await authService.register({
        username: email, // Utiliser l'email comme nom d'utilisateur
        email,
        password,
        firstName,
        lastName,
      });
      
      Alert.alert(
        'Inscription réussie',
        'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (error.response) {
        // Gestion spécifique de l'erreur de rate limit
        if (error.response.status === 429) {
          errorMessage = 'Trop de tentatives d\'inscription. Veuillez réessayer dans quelques minutes.';
        } else {
          // Erreur Strapi standard
          const strapiError = error.response.data?.error;
          if (strapiError) {
            errorMessage = strapiError.message || errorMessage;
          }
        }
      }
      
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Créer un compte</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.nameContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Icon name="person-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  placeholderTextColor={COLORS.darkGray}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Icon name="person-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  placeholderTextColor={COLORS.darkGray}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
            
            <View style={styles.errorRow}>
              <Text style={[styles.errorText, styles.halfInput]}>
                {errors.firstName && errors.firstName}
              </Text>
              <Text style={[styles.errorText, styles.halfInput]}>
                {errors.lastName && errors.lastName}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.darkGray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={22} color={COLORS.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.darkGray}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

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
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xxl,
  },
  backButton: {
    padding: SIZES.xs,
    marginRight: SIZES.md,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  formContainer: {
    marginBottom: SIZES.xxl,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
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
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    ...FONTS.body2,
    color: COLORS.error,
    marginTop: -SIZES.sm,
    marginBottom: SIZES.sm,
    marginLeft: SIZES.md,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  registerButtonText: {
    ...FONTS.h4,
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  loginText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.xs,
  },
});

export default RegisterScreen;