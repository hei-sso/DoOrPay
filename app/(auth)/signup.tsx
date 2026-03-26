import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/AuthInput';
import { PrimaryButton, GoogleButton } from '../../components/Buttons';
import { HeaderWithBack } from '../../components/HeaderWithBack';
import auth from '@react-native-firebase/auth';
import { authApi } from '../../services/authApi';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function SignupScreen() {
  const router = useRouter();
  
  // 상태 관리
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !nickname) return Alert.alert("알림", "필수 항목을 입력해주세요.");
    try {
      // 1. Firebase Auth 계정 생성 (서버 onUserCreated 자동 실행)
      await auth().createUserWithEmailAndPassword(email, password);

      // 2. 추가 정보 업데이트 API 호출
      await authApi.updateUserProfile({
        nickname: nickname,
        phone: phone,
        birth: birth
      });

      Alert.alert("성공", "회원가입 완료!");
      router.replace('./(tabs)/home');
    } catch (error: any) {
      Alert.alert("회원가입 에러", error.message);
    }
  };

  const onGoogleSignup = async () => {
    try {
      // 1. 구글 로그인 시도
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;

      if (!idToken) throw new Error("ID Token missing");

      // 2. Firebase 로그인
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      // 3. 만약 구글 로그인이 처음이라면 백엔드 API를 통해 프로필 초기화 가능
      // (백엔드의 onUserCreated 코드가 실행되지만, 별명을 구글 이름으로 바꾸고 싶다면 호출)
      await authApi.updateUserProfile({
        nickname: userCredential.user.displayName || 'User',
        phone: '',
        birth: ''
      });

      router.replace('./(tabs)/home');
    } catch (error: any) {
      console.log("구글 회원가입 에러:", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* 뒤로가기 헤더 */}
        <HeaderWithBack title="회원가입" />

        <View style={styles.form}>
          {/* 별명 */}
          <Text style={styles.label}>별명</Text>
          <AuthInput 
            placeholder="doorpay" 
            value={nickname}
            onChangeText={setNickname}
          />

          {/* 이메일 + 인증 버튼 */}
          <Text style={styles.label}>이메일</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AuthInput 
                placeholder="example@example.com" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity style={styles.verifyBtn}>
              <Text style={styles.verifyBtnText}>인증</Text>
            </TouchableOpacity>
          </View>

          {/* 비밀번호 */}
          <Text style={styles.label}>비밀번호</Text>
          <AuthInput 
            secureTextEntry 
            placeholder="**********"
            value={password}
            onChangeText={setPassword}
          />

          {/* 전화번호 */}
          <Text style={styles.label}>전화번호</Text>
          <AuthInput 
            placeholder="010-1234-5678" 
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* 생년월일 */}
          <Text style={styles.label}>생년월일</Text>
          <AuthInput 
            placeholder="DD / MM / YYYY" 
            value={birth}
            onChangeText={setBirth}
          />

          {/* 이용약관 안내 */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              계속 진행하면, <Text style={styles.link}>개인정보 처리방침</Text>과 {'\n'}
              <Text style={styles.link}>이용약관</Text>에 동의하는 것으로 간주됩니다.
            </Text>
          </View>

          {/* 회원가입 버튼 */}
          <PrimaryButton title="회원가입" onPress={handleSignup} />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.line} />
          </View>

          {/* 구글 회원가입 */}
          <GoogleButton title="Sign up with Google" onPress={() => {}} />

          {/* 로그인 이동 푸터 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => router.push('./login')}>
              <Text style={styles.footerLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  scrollContent: {
    paddingBottom: 60
  },
  form: {
    paddingHorizontal: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  verifyBtn: {
    backgroundColor: '#3F51B5',
    height: 55,
    width: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  termsContainer: {
    marginVertical: 15,
    alignItems: 'center'
  },
  termsText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18
  },
  link: {
    color: '#3F51B5',
    textDecorationLine: 'underline'
  },
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