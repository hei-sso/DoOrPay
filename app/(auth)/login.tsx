import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// Components
import { AuthInput } from '@/components/AuthInput';
import { GoogleButton, PrimaryButton } from '@/components/Buttons';
import { HeaderWithBack } from '@/components/HeaderWithBack';

// Firebase
import auth from '@react-native-firebase/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('auth.login.fail_alert_title'), t('auth.login.fail_alert_msg'));
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) {
        Alert.alert(t('auth.login.fail_alert_title'), t('auth.login.google_error'));
        return;
      }
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);
      await auth().signInWithCredential(googleCredential);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.log("Google Login Error:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <HeaderWithBack title={t('auth.login.title')} />
      <View style={{ padding: 20 }}>
        <Text style={styles.label}>{t('auth.login.email_label')}</Text>
        <AuthInput placeholder="example@example.com" value={email} onChangeText={setEmail} />
        
        <Text style={styles.label}>{t('auth.login.password_label')}</Text>
        <AuthInput secureTextEntry value={password} onChangeText={setPassword} />
        
        <TouchableOpacity onPress={() => router.push('./reset-password')} style={{ alignSelf: 'flex-end', marginVertical: 10 }}>
          <Text style={{ color: '#888' }}>{t('auth.login.reset_password')}</Text>
        </TouchableOpacity>

        <PrimaryButton title={t('auth.login.login_btn')} onPress={handleEmailLogin} />
        
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{t('auth.login.divider')}</Text>
          <View style={styles.line} />
        </View>

        <GoogleButton title="Sign in with Google" onPress={onGoogleButtonPress} />

        {/* --- 개발용 로그인 없이 진행 버튼 추가 --- */}
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/home')} 
          style={styles.devButton}
        >
          <Text style={styles.devButtonText}>{t('auth.login.dev_login')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.login.footer_text')}</Text>
        <TouchableOpacity onPress={() => router.push('./signup')}>
          <Text style={styles.footerLink}>{t('auth.login.signup_link')}</Text>
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