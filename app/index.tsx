import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Components
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        {/* 이미지 대신 아이콘 사용 */}
        <Ionicons name="checkmark-circle" size={100} color="#3F51B5" />
        <Text style={styles.title}>Do Or Pay</Text>
        <Text style={styles.subtitle}>목표를 달성하거나, 돈을 내거나.</Text>
      </View>

      <View style={{ marginBottom: 40 }}>
        <PrimaryButton 
          title="로그인" 
          onPress={() => router.push('/(auth)/login')} 
        />
        <SecondaryButton 
          title="회원가입" 
          onPress={() => router.push('/(auth)/signup')} 
        />
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