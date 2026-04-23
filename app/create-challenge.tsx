import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createGroupChallenge } from '@/services/challengeApi';

const EMOJIS = ['💧', '🏃', '📚', '🥦', '🧘', '⏰', '✍️', '🍏', '💪', '🔋'];

export default function CreateChallengeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return Alert.alert('알림', '빈칸을 모두 채워주세요.');
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('알림', '올바른 참가비를 입력해주세요.');

    try {
      setLoading(true);
      await createGroupChallenge(title, description, parsedAmount, selectedEmoji, 7);
      Alert.alert('성공', '그룹 챌린지 방이 생성되었습니다!', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('챌린지 생성 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>그룹 챌린지 생성</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.label}>아이콘 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiList}>
          {EMOJIS.map(emoji => (
            <TouchableOpacity 
              key={emoji} 
              onPress={() => setSelectedEmoji(emoji)}
              style={[styles.emojiItem, selectedEmoji === emoji && styles.selectedEmojiItem]}
            >
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>챌린지 방 만들기</Text>
          )}
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
  },
  // 이모지
  emojiList: {
    flexDirection: 'row',
    marginBottom: 20
  },
  emojiItem: {
    width: 54,
    height: 54,
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedEmojiItem: {
    borderColor: '#3182F6',
    backgroundColor: '#E8F3FF'
  }
});