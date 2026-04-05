import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const Menu = ({ icon, title, color = '#333', onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.menuText, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Ionicons name="person" size={40} color="#DDD" /></View>
        <Text style={styles.userName}>김OO 님</Text>
        <Text style={styles.userEmail}>doorpay@example.com</Text>
      </View>

      <View style={styles.menuList}>
        <Menu icon="person-outline" title="프로필 수정" />
        <Menu icon="trophy-outline" title="성공한 챌린지" />
        <Menu icon="settings-outline" title="설정" onPress={() => router.push('/settings')} />
        <Menu icon="log-out-outline" title="로그아웃" color="#FF5252" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#FFF'
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