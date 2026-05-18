import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [pushEnabled, setPushEnabled] = useState(true);

  // 언어 변경 핸들러
  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.items.language'), // "언어 설정"
      '',
      [
        { 
          text: '한국어', 
          onPress: () => i18n.changeLanguage('ko') 
        },
        { 
          text: 'English', 
          onPress: () => i18n.changeLanguage('en') 
        },
        { 
          text: t('settings.items.cancle'),
          style: 'cancel' 
        },
      ]
    );
  };

  // 현재 표시할 언어 이름 (ko -> 한국어, en -> English)
  const currentLanguageName = i18n.language === 'ko' ? '한국어' : 'English';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.alarm')}</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>{t('settings.items.push')}</Text>
          <Switch 
            value={pushEnabled} 
            onValueChange={setPushEnabled}
            trackColor={{ false: '#D1D6DB', true: '#3182F6' }}
          />
        </View>

        {/* 언어 설정 */}
        <TouchableOpacity style={styles.settingItem} onPress={handleLanguageChange}>
          <Text style={styles.settingText}>{t('settings.items.language')}</Text>
          <View style={styles.row}>
            <Text style={styles.langValue}>{currentLanguageName}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.info')}</Text>
        {/* 이용약관 */}
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{t('settings.items.terms')}</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
        
        {/* 개인정보 처리방침 */}
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>{t('settings.items.privacy')}</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
        
        {/* 앱 버전 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>{t('settings.items.version')}</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6'
},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6'
},
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingHorizontal: 24
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8B95A1',
    marginTop: 24,
    marginBottom: 8
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB'
  },
  settingText: {
    fontSize: 16,
    color: '#333D4B'
  },
  versionText: {
    fontSize: 16,
    color: '#8B95A1'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  langValue: {
    fontSize: 16,
    color: '#8B95A1',
    marginRight: 4
  }
});