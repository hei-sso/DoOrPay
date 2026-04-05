import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateChallengeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>그룹 챌린지 생성</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.label}>챌린지 이름</Text>
        <TextInput style={styles.input} placeholder="예) 미라클 모닝 10일 인증" />

        <Text style={styles.label}>챌린지 설명</Text>
        <TextInput 
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
          placeholder="참여 규칙과 인증 방법을 적어주세요." 
          multiline
        />

        <Text style={styles.label}>1인당 참가비 (포인트)</Text>
        <TextInput style={styles.input} placeholder="1,000" keyboardType="number-pad" />
        <Text style={styles.subText}>실패 시 성공한 사람들에게 포인트가 분배됩니다.</Text>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>챌린지 방 만들기</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16
  },
  subText: {
    fontSize: 13,
    color: '#8B95A1',
    marginTop: 8
  },
  bottomArea: {
    padding: 24,
    paddingBottom: 30,
    backgroundColor: '#FFF'
  },
  primaryBtn: {
    backgroundColor: '#1A1F27',
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