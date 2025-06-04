// src/components/CustomAlert.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS, SIZES } from '../Shared/Theme';

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  cancelText = 'Annuler', 
  confirmText = 'OK',
  destructive = false
}) => {
  if (Platform.OS === 'web' && !visible) {
    return null; // Ne rien afficher sur le web si non visible
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity 
                style={styles.button} 
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                destructive && styles.destructiveButton
              ]} 
              onPress={onConfirm}
            >
              <Text style={[
                styles.buttonText,
                destructive && styles.destructiveText
              ]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    width: Platform.OS === 'web' ? 400 : '80%',
    maxWidth: 500,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  message: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginLeft: SIZES.md,
  },
  buttonText: {
    ...FONTS.h4,
    color: COLORS.primary,
  },
  destructiveButton: {
    backgroundColor: COLORS.error + '10',
  },
  destructiveText: {
    color: COLORS.error,
  },
});

export default CustomAlert;