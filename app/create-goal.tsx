import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPersonalGoal } from '@/services/goalApi';

export default function CreateGoalScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('알림', '목표 이름을 입력해주세요.');
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('알림', '올바른 금액을 입력해주세요.');

    try {
      setLoading(true);
      await createPersonalGoal(title, parsedAmount, 7); // 7일짜리 목표 생성
      Alert.alert('성공', '개인 목표가 생성되었습니다!', [
        { text: '확인', onPress: () => router.back() } // 생성 후 뒤로 가기
      ]);
    } catch (error: any) {
      Alert.alert('목표 생성 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인 목표 생성</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.label}>어떤 습관을 만들고 싶나요?</Text>
        <TextInput 
          style={styles.input} 
          placeholder="예) 매일 아침 7시 기상하기" 
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>얼마를 걸까요? (실패 시 차감)</Text>
        <View style={styles.amountInputWrapper}>
          <TextInput 
            style={styles.amountInput} 
            placeholder="0" 
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.currency}>포인트</Text>
        </View>

        <Text style={styles.label}>기간 설정</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn}>
            <Text style={styles.dateText}>오늘부터</Text>
            <Ionicons name="calendar-outline" size={20} color="#8B95A1" />
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 10 }}>~</Text>
          <TouchableOpacity style={styles.dateBtn}>
            <Text style={styles.dateText}>1주일 뒤</Text>
            <Ionicons name="calendar-outline" size={20} color="#8B95A1" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.switchChallengeBtn} onPress={() => router.replace('/create-challenge')}>
          <Text style={styles.switchChallengeText}>혼자 하기 힘드신가요? 그룹 챌린지 만들기 🔥</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>목표 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333D4B',
    marginTop: 24,
    marginBottom: 12
  },
  input: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1F27'
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3182F6',
    paddingBottom: 8
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3182F6'
  },
  currency: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    padding: 16,
    borderRadius: 12
  },
  dateText: {
    fontSize: 15,
    color: '#4E5968'
  },
  switchChallengeBtn: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    alignItems: 'center'
  },
  switchChallengeText: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 14
  },
  bottomArea: {
    padding: 24,
    paddingBottom: 30,
    backgroundColor: '#FFF'
  },
  primaryBtn: {
    backgroundColor: '#3182F6',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18
  }
});