import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// Firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// User 구조 정의
interface UserData {
  email: string;
  nickname: string;
  profileImage: string;
  wallet: {
    balance: number;
    locked: number;
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // 실시간 리스너 연결
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        }
        setLoading(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const Menu = ({ icon, title, color = '#333', onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.menuText, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#3182F6" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tabs.profile.title')}</Text>
      </View>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          {userData?.profileImage ? (
            <Image 
              source={{ uri: userData.profileImage }} 
              style={{ width: 80, height: 80, borderRadius: 40 }} 
            />
          ) : (
            <Ionicons name="person" size={40} color="#DDD" />
          )}
        </View>
        <Text style={styles.userName}>{userData?.nickname || 'User'}{t('tabs.profile.user_suffix')}</Text>
        <Text style={styles.userEmail}>{userData?.email || auth().currentUser?.email}</Text>
      </View>

      <View style={styles.menuList}>
        <Menu icon="person-outline" title={t('tabs.profile.edit_profile')} />
        <Menu icon="trophy-outline" title={t('tabs.profile.success_challenge')} />
        <Menu icon="settings-outline" title={t('tabs.profile.settings')} onPress={() => router.push('/settings')} />
        <Menu icon="log-out-outline" title={t('tabs.profile.logout')} color="#FF5252" onPress={() => auth().signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#FFF'
    },
    header: {
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
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1A1F27'
    },
    profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 8,
    borderBottomColor: '#FAFAFA'
    },
    avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
    },
    userName: {
    fontSize: 20,
    fontWeight: 'bold'
    },
    userEmail: {
    color: '#888',
    marginTop: 4
    },
    menuList: {
    paddingHorizontal: 24,
    paddingTop: 10
    },
    menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9'
    },
    menuLeft: {
    flexDirection: 'row',
    alignItems: 'center'
    },
    menuText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500'
    }
});