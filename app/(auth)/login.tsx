import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Components
import { AuthInput } from '@/components/AuthInput';
import { GoogleButton, PrimaryButton } from '@/components/Buttons';
import { HeaderWithBack } from '@/components/HeaderWithBack';

// Firebase
import auth from '@react-native-firebase/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert("로그인 실패", "이메일 또는 비밀번호를 확인해주세요.");
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) {
        Alert.alert("에러", "구글 인증 정보를 가져올 수 없습니다.");
        return;
      }
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);
      await auth().signInWithCredential(googleCredential);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.log("구글 로그인 에러:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <HeaderWithBack title="로그인" />
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>이메일</Text>
        <AuthInput placeholder="example@example.com" value={email} onChangeText={setEmail} />
        <Text style={styles.label}>비밀번호</Text>
        <AuthInput secureTextEntry value={password} onChangeText={setPassword} />
        
        <TouchableOpacity onPress={() => router.push('./reset-password')} style={{ alignSelf: 'flex-end', marginVertical: 10 }}>
          <Text style={{ color: '#888' }}>비밀번호 재설정</Text>
        </TouchableOpacity>

        <PrimaryButton title="이메일로 로그인" onPress={handleEmailLogin} />
        
        <View style={styles.divider}>
          <View style={styles.line} /><Text style={styles.dividerText}>또는</Text><View style={styles.line} />
        </View>

        <GoogleButton title="Sign in with Google" onPress={onGoogleButtonPress} />

        {/* --- 개발용 로그인 없이 진행 버튼 추가 --- */}
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/home')} 
          style={styles.devButton}
        >
          <Text style={styles.devButtonText}>개발용: 로그인 없이 진행</Text>
        </TouchableOpacity>
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
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  line: { flex: 1,
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
  },
  // 개발용 버튼 스타일
  devButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  devButtonText: {
    color: '#4E5968',
    fontWeight: '600',
    fontSize: 13
  }
});