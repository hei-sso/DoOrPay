import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        {/* 이미지 대신 아이콘 사용 */}
        <Ionicons name="checkmark-circle" size={100} color="#3F51B5" />
        <Text style={styles.title}>Do Or Pay</Text>
        <Text style={styles.subtitle}>홈 화면 구현 중...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 20 
  },
  logoBox: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#3F51B5', 
    marginTop: 10 
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 5
  }
});