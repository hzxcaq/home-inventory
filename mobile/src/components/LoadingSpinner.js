import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({ text, size = 'large', color = '#06b6d4' }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.text}>{text || t('loading')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingSpinner;