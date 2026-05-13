import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next'
import '@/constants/i18n';

// API
import { authApi } from '@/services/authApi';

// Components
import { AuthInput } from '@/components/AuthInput';
import { GoogleButton, PrimaryButton } from '@/components/Buttons';
import { HeaderWithBack } from '@/components/HeaderWithBack';

// Firebase
import auth from '@react-native-firebase/auth';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // 상태 관리
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !nickname) return Alert.alert(t('auth.login.fail_alert_title'), t('auth.signup.required_alert'));
    try {
      // 1. Firebase Auth 계정 생성
      await auth().createUserWithEmailAndPassword(email, password);

      // 2. 추가 정보 업데이트 API 호출
      await authApi.updateUserProfile({
        nickname: nickname,
        phone: phone,
        birth: birth
      });

      Alert.alert(t('auth.login.fail_alert_title'), t('auth.signup.success_msg'));
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('auth.signup.title'), error.message);
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

      router.replace('/(tabs)/home');
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
        <HeaderWithBack title={t('auth.signup.title')} />

        <View style={styles.form}>
          {/* 별명 */}
          <Text style={styles.label}>{t('auth.signup.nickname')}</Text>
          <AuthInput placeholder="doorpay" value={nickname} onChangeText={setNickname} />

          {/* 이메일 + 인증 버튼 */}          
          <Text style={styles.label}>{t('auth.signup.email')}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AuthInput placeholder="example@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => Alert.alert(t('auth.login.fail_alert_title'), t('auth.signup.verify_msg'))}>
              <Text style={styles.verifyBtnText}>{t('auth.signup.verify')}</Text>
            </TouchableOpacity>
          </View>

          {/* 비밀번호 */}
          <Text style={styles.label}>{t('auth.signup.password')}</Text>
          <AuthInput secureTextEntry placeholder="**********" value={password} onChangeText={setPassword} />

          {/* 전화번호 */}
          <Text style={styles.label}>{t('auth.signup.phone')}</Text>
          <AuthInput placeholder="010-1234-5678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          {/* 생년월일 */}
          <Text style={styles.label}>{t('auth.signup.birth')}</Text>
          <AuthInput placeholder="DD / MM / YYYY" value={birth} onChangeText={setBirth} />

          {/* 이용약관 안내 */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              {t('auth.signup.terms_1')}
              <Text style={styles.link}>{t('auth.signup.terms_privacy')}</Text>
              {t('auth.signup.terms_2')}
              <Text style={styles.link}>{t('auth.signup.terms_service')}</Text>
              {t('auth.signup.terms_3')}
            </Text>
          </View>

          {/* 회원가입 버튼 */}
          <PrimaryButton title={t('auth.signup.button')} onPress={handleSignup} />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>{t('auth.login.divider')}</Text>
            <View style={styles.line} />
          </View>

          {/* 구글 회원가입 */}
          <GoogleButton title="Sign up with Google" onPress={onGoogleSignup} />

          {/* 로그인 이동 푸터 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.signup.footer_text')}</Text>
            <TouchableOpacity onPress={() => router.push('./login')}>
              <Text style={styles.footerLink}>{t('auth.signup.login_link')}</Text>
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