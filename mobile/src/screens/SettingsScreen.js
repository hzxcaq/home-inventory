import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();

  // Settings state
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      const savedAutoBackup = await AsyncStorage.getItem('autoBackup');

      if (savedNotifications !== null) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
      if (savedAutoBackup !== null) {
        setAutoBackup(JSON.parse(savedAutoBackup));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('language', languageCode);
      setCurrentLanguage(languageCode);

      Toast.show({
        type: 'success',
        text1: t('success'),
        text2: t('languageChanged'),
      });
    } catch (error) {
      console.error('Error changing language:', error);
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: t('failedToChangeLanguage'),
      });
    }
  };

  const showLanguageSelector = () => {
    Alert.alert(
      t('selectLanguage'),
      t('chooseLanguage'),
      [
        {
          text: 'English',
          onPress: () => changeLanguage('en'),
          style: currentLanguage === 'en' ? 'default' : 'default',
        },
        {
          text: '中文',
          onPress: () => changeLanguage('zh'),
          style: currentLanguage === 'zh' ? 'default' : 'default',
        },
        {
          text: t('cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleNotificationsToggle = async (value) => {
    setNotifications(value);
    await saveSettings('notifications', value);

    Toast.show({
      type: 'info',
      text1: t('notifications'),
      text2: value ? t('notificationsEnabled') : t('notificationsDisabled'),
    });
  };

  const handleDarkModeToggle = async (value) => {
    setDarkMode(value);
    await saveSettings('darkMode', value);

    Toast.show({
      type: 'info',
      text1: t('darkMode'),
      text2: value ? t('darkModeEnabled') : t('darkModeDisabled'),
    });
  };

  const handleAutoBackupToggle = async (value) => {
    setAutoBackup(value);
    await saveSettings('autoBackup', value);

    Toast.show({
      type: 'info',
      text1: t('autoBackup'),
      text2: value ? t('autoBackupEnabled') : t('autoBackupDisabled'),
    });
  };

  const handleClearData = () => {
    Alert.alert(
      t('clearAllData'),
      t('confirmClearData'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would clear the database here
              Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('dataCleared'),
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToClearData'),
              });
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      t('exportData'),
      t('exportDataDescription'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('export'),
          onPress: () => {
            // In a real app, you would implement data export here
            Toast.show({
              type: 'info',
              text1: t('export'),
              text2: t('exportFeatureComingSoon'),
            });
          },
        },
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      t('importData'),
      t('importDataDescription'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('import'),
          onPress: () => {
            // In a real app, you would implement data import here
            Toast.show({
              type: 'info',
              text1: t('import'),
              text2: t('importFeatureComingSoon'),
            });
          },
        },
      ]
    );
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/anthropics/claude-code');
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@example.com');
  };

  const renderSettingItem = ({ title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* App Settings */}
      {renderSection(t('appSettings'), [
        renderSettingItem({
          key: 'language',
          title: t('language'),
          subtitle: currentLanguage === 'en' ? 'English' : '中文',
          onPress: showLanguageSelector,
        }),
        renderSettingItem({
          key: 'notifications',
          title: t('notifications'),
          subtitle: t('receiveNotifications'),
          rightComponent: (
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#e1e5e9', true: '#06b6d4' }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
            />
          ),
          showArrow: false,
        }),
        renderSettingItem({
          key: 'darkMode',
          title: t('darkMode'),
          subtitle: t('darkModeDescription'),
          rightComponent: (
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#e1e5e9', true: '#06b6d4' }}
              thumbColor={darkMode ? '#fff' : '#f4f3f4'}
            />
          ),
          showArrow: false,
        }),
      ])}

      {/* Data Management */}
      {renderSection(t('dataManagement'), [
        renderSettingItem({
          key: 'autoBackup',
          title: t('autoBackup'),
          subtitle: t('autoBackupDescription'),
          rightComponent: (
            <Switch
              value={autoBackup}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ false: '#e1e5e9', true: '#06b6d4' }}
              thumbColor={autoBackup ? '#fff' : '#f4f3f4'}
            />
          ),
          showArrow: false,
        }),
        renderSettingItem({
          key: 'exportData',
          title: t('exportData'),
          subtitle: t('exportDataSubtitle'),
          onPress: handleExportData,
        }),
        renderSettingItem({
          key: 'importData',
          title: t('importData'),
          subtitle: t('importDataSubtitle'),
          onPress: handleImportData,
        }),
        renderSettingItem({
          key: 'clearData',
          title: t('clearAllData'),
          subtitle: t('clearDataWarning'),
          onPress: handleClearData,
          rightComponent: <Text style={styles.dangerText}>{t('clear')}</Text>,
          showArrow: false,
        }),
      ])}

      {/* Support */}
      {renderSection(t('support'), [
        renderSettingItem({
          key: 'github',
          title: t('sourceCode'),
          subtitle: t('viewOnGitHub'),
          onPress: openGitHub,
        }),
        renderSettingItem({
          key: 'support',
          title: t('contactSupport'),
          subtitle: t('getHelp'),
          onPress: openSupport,
        }),
      ])}

      {/* About */}
      {renderSection(t('about'), [
        renderSettingItem({
          key: 'version',
          title: t('version'),
          subtitle: '1.0.0',
          showArrow: false,
        }),
        renderSettingItem({
          key: 'appName',
          title: t('appName'),
          subtitle: t('appDescription'),
          showArrow: false,
        }),
      ])}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('madeWithLove')} ❤️
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
  dangerText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
