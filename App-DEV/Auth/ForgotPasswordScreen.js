// src/screens/auth/ForgotPasswordScreen.js
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { authService } from '../Shared/strapiService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email || !email.trim()) {
      setError('L\'email est requis');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Format d\'email invalide');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      console.error('Erreur de réinitialisation de mot de passe:', error);
      let errorMessage = 'Une erreur est survenue lors de la demande de réinitialisation';
      
      if (error.response) {
        // Erreur Strapi
        const strapiError = error.response.data?.error;
        if (strapiError) {
          errorMessage = strapiError.message || errorMessage;
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu lorsque l'email de réinitialisation a été envoyé
  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <Image
        source={require('../Assets/images/email-sent.png')}
        style={styles.successImage}
        resizeMode="contain"
      />
      <Text style={styles.successTitle}>Email envoyé !</Text>
      <Text style={styles.successText}>
        Un email de réinitialisation a été envoyé à l'adresse {email}. Veuillez vérifier votre boîte de réception et suivre les instructions.
      </Text>
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.returnButtonText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );

  // Rendu du formulaire de demande de réinitialisation
  const renderForm = () => (
    <>
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Mot de passe oublié ?</Text>
        <Text style={styles.infoText}>
          Saisissez l'adresse email associée à votre compte pour recevoir un lien de réinitialisation de mot de passe.
        </Text>
      </View>

      <View style={styles.formContainer}>
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.resetButtonText}>Envoyer le lien</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Icon name="arrow-back" size={18} color={COLORS.primary} />
        <Text style={styles.backToLoginText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </>
  );

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
            <Text style={styles.title}>Réinitialisation</Text>
          </View>

          {emailSent ? renderSuccess() : renderForm()}
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
    marginBottom: SIZES.xl,
  },
  backButton: {
    padding: SIZES.xs,
    marginRight: SIZES.md,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  infoContainer: {
    marginBottom: SIZES.xl,
  },
  infoTitle: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  infoText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  formContainer: {
    marginBottom: SIZES.xl,
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
  errorText: {
    ...FONTS.body2,
    color: COLORS.error,
    marginTop: -SIZES.sm,
    marginBottom: SIZES.sm,
    marginLeft: SIZES.md,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEUMORPHISM.light,
  },
  resetButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
  },
  backToLoginText: {
    ...FONTS.body2,
    color: COLORS.primary,
    marginLeft: SIZES.xs,
  },
  successContainer: {
    alignItems: 'center',
    padding: SIZES.lg,
  },
  successImage: {
    width: 150,
    height: 150,
    marginBottom: SIZES.lg,
  },
  successTitle: {
    ...FONTS.h2,
    color: COLORS.primary,
    marginBottom: SIZES.md,
  },
  successText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  returnButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...NEUMORPHISM.light,
  },
  returnButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default ForgotPasswordScreen;