import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// Components
import { AuthInput } from '@/components/AuthInput';
import { PrimaryButton } from '@/components/Buttons';
import { HeaderWithBack } from '@/components/HeaderWithBack';

// Firebase
import auth from '@react-native-firebase/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handlePasswordReset = async () => {
    if (!email) return Alert.alert(t('auth.login.fail_alert_title'), t('auth.reset.email_required'));
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(t('auth.login.fail_alert_title'), t('auth.reset.success_msg'));
      router.back();
    } catch (error: any) {
      Alert.alert(t('auth.login.fail_alert_title'), error.message);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title={t('auth.reset.title')} />
      <View style={styles.content}>
       <Text style={styles.label}>{t('auth.login.email_label')}</Text>
        <AuthInput 
          placeholder="example@example.com" 
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Text style={styles.infoText}>{t('auth.reset.info')}</Text>

        <View style={{ marginTop: 20 }}>
          <PrimaryButton title={t('auth.reset.button')} onPress={handlePasswordReset} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  infoText: { 
    fontSize: 13, 
    color: '#888', 
    marginTop: 10, 
    lineHeight: 18 
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
  }
});