// src/components/common/SearchBar.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

/**
 * Barre de recherche réutilisable
 * @param {Object} props - Propriétés du composant
 * @param {string} props.placeholder - Texte d'indication
 * @param {string} props.value - Valeur de la recherche
 * @param {Function} props.onChangeText - Fonction appelée lors de la modification du texte
 * @param {Function} props.onSubmit - Fonction appelée lors de la soumission (Enter)
 * @param {Function} props.onClear - Fonction appelée lors de l'effacement
 * @param {boolean} props.autoFocus - Si le champ doit être automatiquement focalisé
 * @param {boolean} props.loading - Si la recherche est en cours
 * @param {Object} props.style - Styles supplémentaires
 * @param {Object} props.inputStyle - Styles supplémentaires pour l'input
 */
const SearchBar = ({
  placeholder = 'Rechercher...',
  value = '',
  onChangeText,
  onSubmit,
  onClear,
  autoFocus = false,
  loading = false,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(autoFocus);
  
  // Gérer la soumission
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(value);
    }
    Keyboard.dismiss();
  };
  
  // Gérer l'effacement
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    if (onClear) {
      onClear();
    }
  };
  
  return (
    <View style={[styles.container, isFocused && styles.focusedContainer, style]}>
      <Icon name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
      
      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.darkGray}
        autoFocus={autoFocus}
        returnKeyType="search"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSubmit}
        {...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})}
      />
      
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.activityIndicator} />
      ) : value ? (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Icon name="close-circle" size={20} color={COLORS.darkGray} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: Platform.OS === 'ios' ? SIZES.sm : 0,
    ...NEUMORPHISM.light,
  },
  focusedContainer: {
    borderWidth: 1,
    borderColor: COLORS.primary + '80', // Version semi-transparente de la couleur primaire
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    ...FONTS.body1,
    color: COLORS.textPrimary,
    height: 40,
    padding: 0,
  },
  clearButton: {
    padding: SIZES.xs,
  },
  activityIndicator: {
    marginHorizontal: SIZES.xs,
  },
});

export default SearchBar;