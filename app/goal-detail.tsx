import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// API
import { submitVerification, subscribeToVerifications, uploadImageToStorage } from '@/services/verificationApi';

// Firebase
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

export default function GoalDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id, title, amount, emoji } = useLocalSearchParams();

  // 데이터 상태 관리
  const [realData, setRealData] = useState<any>(null); // 목표 상세 정보
  const [history, setHistory] = useState<any[]>([]); // 인증 히스토리

  // UI 상태 관리
  const [isUploading, setIsUploading] = useState(false);

  // 실제 데이터 및 히스토리 구독
  useEffect(() => {
    if (!id) return;
    
    // 목표 기본 정보 구독
    const unsubData = firestore().collection('goals').doc(id as string).onSnapshot(doc => {
      if (doc.exists()) setRealData(doc.data());
    });

    // 인증 히스토리 구독
    const unsubHistory = subscribeToVerifications(id as string, (data) => setHistory(data));

    return () => { unsubData(); unsubHistory(); };
  }, [id]);

  // 날짜 변환 헬퍼 (Timestamp -> YYYY.MM.DD)
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  // 진행일 계산 헬퍼
  const calculateDays = (startTs: any, endTs: any) => {
    if (!startTs || !endTs) return 0;
    return Math.floor((endTs.toDate() - startTs.toDate()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // 이미지 업로드 로직 (카메라/갤러리 선택)
  const handleUploadClick = () => {
    Alert.alert(
      t('detail.upload.action_title'),
      t('detail.upload.action_desc'),
      [
        { text: t('detail.upload.camera'), onPress: openCamera },
        { text: t('detail.upload.gallery'), onPress: openGallery },
        { text: t('auth.login.divider'), style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert(t('detail.upload.permission_title'), t('detail.upload.permission_msg'));
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, // 이미지 용량 최적화
    });
    if (!result.canceled) processImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert(t('detail.upload.permission_title'), t('detail.upload.permission_msg'));
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) processImage(result.assets[0].uri);
  };

    // 스토리지 업로드
  const processImage = async (uri: string) => {
    try {
      setIsUploading(true);
      // 1. Firebase Storage에 사진 업로드
      const imageUrl = await uploadImageToStorage(uri, id as string);
      
      // 2. 백엔드 호출해서 verifications 컬렉션에 기록 남기기
      await submitVerification(id as string, 'goal', imageUrl);
      
      Alert.alert(t('tabs.home.alert_title'), t('detail.upload.success_msg'));
    } catch (error: any) {
      Alert.alert(t('detail.upload.fail_msg'), error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 화면 표시용 데이터 정리
  const startDate = realData?.startDate ? formatDate(realData.startDate) : '-';
  const endDate = realData?.endDate ? formatDate(realData.endDate) : '-';
  const totalDays = calculateDays(realData?.startDate, realData?.endDate);
  const currentStreak = history.filter(item => item.status === 'approved').length;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('detail.title')}</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1F27" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 요약 섹션 */}
        <View style={styles.topSection}>
          <View style={styles.emojiCircle}>
            <Text style={{ fontSize: 40 }}>{realData?.emoji || emoji || '🎯'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#E8F3FF' }]}>
            <Text style={[styles.badgeText, { color: '#3182F6' }]}>{t('detail.types.personal')}</Text>
          </View>
          <Text style={styles.mainTitle}>{realData?.title || title}</Text>
          <Text style={styles.descriptionText}>{t('create.placeholders.description')}</Text>
        </View>

        {/* 대시보드 */}
        <View style={styles.dashboard}>
          <View style={styles.dashItem}>
            <Text style={styles.dashLabel}>{t('detail.dashboard.stake_personal')}</Text>
            <Text style={styles.dashValue}>{(realData?.stakeAmount || Number(amount) || 0).toLocaleString()} P</Text>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashItem}>
            <Text style={styles.dashLabel}>{t('detail.dashboard.period')}</Text>
            <Text style={styles.dashValue}>{t('detail.dashboard.days_unit', { days: totalDays })}</Text>
          </View>
        </View>

        {/* 상세 일정 섹션 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#8B95A1" />
            <Text style={styles.infoLabel}>{t('detail.info.start')}</Text>
            <Text style={styles.infoValue}>{startDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={20} color="#8B95A1" />
            <Text style={styles.infoLabel}>{t('detail.info.end')}</Text>
            <Text style={styles.infoValue}>{endDate}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="flame-outline" size={20} color="#FF5252" />
            <Text style={styles.infoLabel}>{t('detail.info.status_personal')}</Text>
            <Text style={[styles.infoValue, { color: '#FF5252', fontWeight: 'bold' }]}>{t('detail.info.success_count', { count: currentStreak })}</Text>
          </View>
        </View>

        {/* 인증 히스토리 갤러리 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('detail.history.my_record')}</Text>
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/verification-feed',
              params: { targetId: id, title: realData?.title || title }
            })}
          >
            <Text style={styles.moreText}>{t('detail.history.view_all')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {history.length === 0 ? (
             <Text style={{color: '#8B95A1', marginTop: 20, marginLeft: 10}}>{t('detail.history.empty')}</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Image 
                  source={{ uri: item.img }} 
                  style={[
                    styles.historyImg,
                    // 반려되었을 때만 이미지에 빨간 테두리 살짝
                    item.status === 'rejected' && { borderColor: '#FF5252', borderWidth: 2 } 
                  ]} 
                />
                
                {/* 이미지 우측 상단 상태 뱃지 */}
                <View style={styles.statusBadge}>
                  {item.status === 'approved' && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                  {item.status === 'rejected' && <Ionicons name="close-circle" size={20} color="#FF5252" />}
                  {item.status === 'pending' && <ActivityIndicator size="small" color="#FF9800" />}
                </View>

                <View style={styles.historyDateBadge}>
                  <Text style={styles.historyDateText}>{item.date}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadClick} disabled={isUploading}>
          {isUploading ? <ActivityIndicator color="#FFF" /> : (
            <><Ionicons name="camera" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.uploadBtnText}>{t('detail.upload.action_title')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16, 
    backgroundColor: '#FFF' 
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  scrollContent: {
    paddingBottom: 160
  },
  // 상단 요약
  topSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingBottom: 32
  },
  emojiCircle: { 
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F27',
    marginBottom: 8
  },
  descriptionText: {
    fontSize: 15,
    color: '#8B95A1'
  },
  // 대시보드
  dashboard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginTop: 20, 
    borderRadius: 24, 
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dashItem: {
    flex: 1,
    alignItems: 'center'
  },
  dashLabel: {
    fontSize: 13,
    color: '#8B95A1',
    marginBottom: 4
  },
  dashValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3182F6'
  },
  dashDivider: {
    width: 1,
    backgroundColor: '#F2F4F6',
    marginHorizontal: 10
  },
  // 상세 정보 카드
  infoCard: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 24,
    padding: 20
  },
  infoRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB'
  },
  infoLabel: {
    fontSize: 15,
    color: '#4E5968',
    marginLeft: 12,
    flex: 1
  },
  infoValue: {
    fontSize: 15,
    color: '#1A1F27',
    fontWeight: '500'
  },
  // 갤러리 섹션 스타일
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  moreText: {
    color: '#8B95A1',
    fontSize: 14
  },
  gallery: {
    paddingLeft: 20,
    paddingRight: 10
  },
  historyItem: {
    marginRight: 12,
    alignItems: 'center'
  },
  historyImg: {
    width: 110,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#E5E8EB'
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
    elevation: 2, 
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  historyDateBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  historyDateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  // 하단 버튼
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    padding: 24, 
    paddingBottom: 60, 
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  uploadBtn: { 
    backgroundColor: '#3182F6', 
    flexDirection: 'row', 
    paddingVertical: 18, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});