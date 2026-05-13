import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

//API
import { createPersonalGoal } from '@/services/goalApi';

const EMOJIS = ['💧', '🏃', '📚', '🥦', '🧘', '⏰', '✍️', '🍏', '💪', '🔋'];

export default function CreateGoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [loading, setLoading] = useState(false);

  // 날짜 상태 관리 (기본값: 오늘 ~ 7일 뒤)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 7)));

  // 모달 표시 여부 상태
  const [isStartPickerVisible, setStartPickerVisibility] = useState(false);
  const [isEndPickerVisible, setEndPickerVisibility] = useState(false);

  // 날짜 포맷팅 (예: 2026.04.23)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert(t('home.alert_title'), t('create.alerts.fill_all'));
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert(t('home.alert_title'), t('create.alerts.invalid_amount'));

    try {
      setLoading(true);
      await createPersonalGoal(title, parsedAmount, selectedEmoji, startDate, endDate);
      Alert.alert(t('home.alert_title'), t('create.alerts.success_personal'), [
        { text: t('home.alert_title'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert(t('home.alert_error'), error.message);
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
        <Text style={styles.headerTitle}>{t('create.personal_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
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

        <Text style={styles.label}>{t('create.labels.goal_name')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('create.placeholders.personal_goal')} 
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>{t('create.labels.amount_personal')}</Text>
        <View style={styles.amountInputWrapper}>
          <TextInput 
            style={styles.amountInput} 
            placeholder={t('create.placeholders.amount')} 
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.currency}>{t('wallet.unit', 'P')}</Text>
        </View>

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

        <TouchableOpacity style={styles.switchChallengeBtn} onPress={() => router.replace('/create-challenge')}>
          <Text style={styles.switchChallengeText}>{t('create.help_text.switch_to_challenge')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('create.buttons.start_goal')}</Text>}
        </TouchableOpacity>
      </View>

      {/* 시작일 모달 */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="date"
        date={startDate}
        onConfirm={(date) => {
          setStartDate(date);
          // 시작일이 종료일보다 뒤로 가면 종료일도 자동으로 맞춰줌
          if (date > endDate) setEndDate(date);
          setStartPickerVisibility(false);
        }}
        onCancel={() => setStartPickerVisibility(false)}
        confirmTextIOS={t('home.alert_title')}
        cancelTextIOS={t('auth.login.divider')}
      />

      {/* 종료일 모달 */}
      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="date"
        date={endDate}
        minimumDate={startDate} // 종료일은 시작일 이전으로 선택 못하게 막음
        onConfirm={(date) => {
          setEndDate(date);
          setEndPickerVisibility(false);
        }}
        onCancel={() => setEndPickerVisibility(false)}
        confirmTextIOS={t('home.alert_title')}
        cancelTextIOS={t('auth.login.divider')}
      />
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