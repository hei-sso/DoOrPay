import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

// Components
import { AuthInput } from '@/components/AuthInput';
import { PrimaryButton } from '@/components/Buttons';
import { HeaderWithBack } from '@/components/HeaderWithBack';

// Firebase
import auth from '@react-native-firebase/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handlePasswordReset = async () => {
    if (!email) return Alert.alert("알림", "이메일을 입력해주세요.");
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert("성공", "비밀번호 재설정 이메일이 발송되었습니다.");
      router.back();
    } catch (error: any) {
      Alert.alert("에러", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="비밀번호 재설정" />
      <View style={styles.content}>
        <Text style={styles.label}>이메일</Text>
        <AuthInput 
          placeholder="example@example.com" 
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Text style={styles.infoText}>
          가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </Text>

        <View style={{ marginTop: 20 }}>
          <PrimaryButton title="재설정 메일 보내기" onPress={handlePasswordReset} />
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