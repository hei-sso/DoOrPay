import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// API
import { createGroupChallenge } from '@/services/challengeApi';

const EMOJIS = ['🔥', '💪', '🏃', '🤝', '🎯', '📈', '✨', '🏆', '🙌', '🚀'];

export default function CreateChallengeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [loading, setLoading] = useState(false);

  // 날짜 상태 (기본값: 오늘 ~ 7일 뒤)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 7)));
  
  // 날짜 피커 모달 상태
  const [isStartPickerVisible, setStartPickerVisibility] = useState(false);
  const [isEndPickerVisible, setEndPickerVisibility] = useState(false);

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return Alert.alert(t('home.alert_title'), t('create.alerts.fill_all'));
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert(t('home.alert_title'), t('create.alerts.invalid_amount'));

    try {
      setLoading(true);
      // API 호출 시 시작일과 종료일 전달
      await createGroupChallenge(title, description, parsedAmount, selectedEmoji, startDate, endDate);
      Alert.alert(t('home.alert_title'), t('create.alerts.success_challenge'), [
        { text: t('home.alert_title'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert(t('home.alert_error'), error.message);
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
        <Text style={styles.headerTitle}>{t('create.challenge_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
        {/* 이모지 선택 */}
        <Text style={styles.label}>{t('create.labels.icon')}</Text>
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

        <Text style={styles.label}>{t('create.labels.challenge_name')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('create.placeholders.challenge_goal')} 
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>{t('create.labels.description')}</Text>
        <TextInput 
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
          placeholder={t('create.placeholders.description')} 
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>{t('create.labels.amount_challenge')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('create.placeholders.amount')} 
          keyboardType="number-pad" 
          value={amount}
          onChangeText={setAmount}
        />
        <Text style={styles.subText}>{t('create.help_text.challenge_fee')}</Text>

        {/* 기간 설정 섹션 추가 */}
        <Text style={styles.label}>{t('create.labels.period')}</Text>
        <View style={styles.dateRow}>
          {/* 시작일 버튼 */}
          <TouchableOpacity style={styles.dateBtn} onPress={() => setStartPickerVisibility(true)}>
            <Text style={[styles.dateText, { fontWeight: 'bold', color: '#1A1F27' }]}>{formatDate(startDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color="#3182F6" />
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 10 }}>~</Text>
          {/* 종료일 버튼 */}
          <TouchableOpacity style={styles.dateBtn} onPress={() => setEndPickerVisibility(true)}>
            <Text style={[styles.dateText, { fontWeight: 'bold', color: '#1A1F27' }]}>{formatDate(endDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('create.buttons.create_challenge')}</Text>}
        </TouchableOpacity>
      </View>

      {/* 시작일 선택 모달 */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="date"
        date={startDate}
        onConfirm={(date) => {
          setStartDate(date);
          if (date > endDate) setEndDate(date); // 시작일이 종료일보다 늦으면 종료일 자동 조정
          setStartPickerVisibility(false);
        }}
        onCancel={() => setStartPickerVisibility(false)}
        confirmTextIOS={t('home.alert_title')}
        cancelTextIOS={t('auth.login.divider')}
      />

      {/* 종료일 선택 모달 */}
      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="date"
        date={endDate}
        minimumDate={startDate} // 시작일 이전은 선택 불가
        onConfirm={(date) => {
          setEndDate(date);
          setEndPickerVisibility(false);
        }}
        onCancel={() => setEndPickerVisibility(false)}
        confirmTextIOS={t('home.alert_title')}
        cancelTextIOS={t('auth.login.divider')}
      />
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