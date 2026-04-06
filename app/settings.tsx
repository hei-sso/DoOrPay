import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>앱 푸시 알림</Text>
          <Switch 
            value={pushEnabled} 
            onValueChange={setPushEnabled}
            trackColor={{ false: '#D1D6DB', true: '#3182F6' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>정보</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>이용약관</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>개인정보 처리방침</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>앱 버전</Text>
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
  }
});