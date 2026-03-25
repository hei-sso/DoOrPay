import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/AuthInput';
import { PrimaryButton, GoogleButton } from '../../components/Buttons';
import { HeaderWithBack } from '../../components/HeaderWithBack';

export default function LoginScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <HeaderWithBack title="로그인" />
      <View style={{ padding: 20 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>이메일</Text>
        <AuthInput placeholder="example@example.com" />
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>비밀번호</Text>
        <AuthInput secureTextEntry />
        
        <TouchableOpacity onPress={() => router.push('./reset-password')} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: '#888' }}>비밀번호 재설정</Text>
        </TouchableOpacity>

        <PrimaryButton title="이메일로 로그인" onPress={() => {}} />
        
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.line} />
        </View>

        <GoogleButton title="Sign in with Google" onPress={() => {}} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Do Or Pay가 처음이신가요? </Text>
        <TouchableOpacity onPress={() => router.push('./signup')}>
          <Text style={styles.footerLink}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE'
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14
  },
    footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25
  },
  footerText: {
    color: '#555',
    fontSize: 15
  },
  footerLink: {
    color: '#3F51B5',
    fontWeight: 'bold',
    fontSize: 15
  }
});