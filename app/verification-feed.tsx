import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// API
import { subscribeToVerifications } from '@/services/verificationApi';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3; // 한 줄에 3개씩 표시
const IMAGE_SIZE = width / COLUMN_COUNT;

export default function VerificationFeedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { targetId, title } = useLocalSearchParams();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;

    // 해당 목표/챌린지의 모든 인증 기록 구독
    const unsub = subscribeToVerifications(targetId as string, (data) => {
      setHistory(data);
      setLoading(false);
    });

    return () => unsub();
  }, [targetId]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.imageWrapper}>
      <Image source={{ uri: item.img }} style={styles.feedImage} />
      {/* 상태 표시 아이콘 */}
      <View style={styles.statusBadge}>
        {item.status === 'approved' && <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />}
        {item.status === 'rejected' && <Ionicons name="close-circle" size={18} color="#FF5252" />}
        {item.status === 'pending' && <ActivityIndicator size="small" color="#FF9800" />}
      </View>
      <View style={styles.dateLabel}>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('feed.title', { title })}
        </Text>
        <View style={{ width: 44 }} /> 
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#3182F6" />
      ) : history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t('feed.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingTop: 60, 
    paddingBottom: 16, 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6'
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27',
    flex: 1,
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: 40
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 1.3,
    padding: 1, // 사진 사이 간격
    position: 'relative'
  },
  feedImage: { flex: 1, backgroundColor: '#F2F4F6' },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 2
  },
  dateLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  dateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#8B95A1',
    fontSize: 16
  }
});