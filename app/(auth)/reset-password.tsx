import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthInput } from '../../components/AuthInput';
import { PrimaryButton } from '../../components/Buttons';
import { HeaderWithBack } from '../../components/HeaderWithBack';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    // TODO: Firebase 비밀번호 재설정 로직 연결
    console.log("비밀번호 변경 시도:", email);
    alert("비밀번호 변경 요청이 전송되었습니다.");
    router.back(); // 변경 후 이전 화면(로그인)으로 이동
  };

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼이 포함된 헤더 */}
      <HeaderWithBack title="비밀번호 재설정" />

      <View style={styles.content}>
        {/* 이메일 입력 및 인증 버튼 */}
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
          <TouchableOpacity 
            style={styles.verifyBtn} 
            onPress={() => alert("인증 메일이 발송되었습니다.")}
          >
            <Text style={styles.verifyBtnText}>인증</Text>
          </TouchableOpacity>
        </View>

        {/* 새 비밀번호 입력 */}
        <Text style={styles.label}>새 비밀번호</Text>
        <AuthInput 
          secureTextEntry 
          placeholder="********"
          value={newPassword}
          onChangeText={setNewPassword}
        />

        {/* 새 비밀번호 확인 */}
        <Text style={styles.label}>새 비밀번호 확인</Text>
        <AuthInput 
          secureTextEntry 
          placeholder="********"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* 비밀번호 변경 버튼 */}
        <View style={{ marginTop: 20 }}>
          <PrimaryButton title="비밀번호 변경" onPress={handlePasswordChange} />
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