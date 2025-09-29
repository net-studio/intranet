// src/components/calendar/RSVPButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../Shared/Theme';

const RSVPButton = ({ status, selected, onPress }) => {
  // Configuration des styles en fonction du statut
  const getConfig = () => {
    switch (status) {
      case 'accept':
        return {
          icon: 'checkmark-circle',
          color: COLORS.success,
          label: 'Oui'
        };
      case 'tentative':
        return {
          icon: 'help-circle',
          color: COLORS.warning,
          label: 'Peut-être'
        };
      case 'decline':
        return {
          icon: 'close-circle',
          color: COLORS.error,
          label: 'Non'
        };
      default:
        return {
          icon: 'ellipse',
          color: COLORS.gray,
          label: ''
        };
    }
  };
  
  const config = getConfig();
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        selected && { backgroundColor: config.color + '20' } // Ajout d'opacité pour le fond
      ]}
      onPress={onPress}
    >
      <Icon name={config.icon} size={18} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.sm,
    marginLeft: SIZES.xs,
  },
  label: {
    ...FONTS.body2,
    marginLeft: 4,
  },
});

export default RSVPButton;