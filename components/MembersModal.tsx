import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MembersModalProps {
  visible: boolean;
  onClose: () => void;
  members: any[];
}

export default function MembersModal({ visible, onClose, members }: MembersModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>참가자 현황 ({members.length}명)</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#1A1F27" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {members.map((member) => (
              <View key={member.uid} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.nickname?.[0] || '?'}</Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nickname}>{member.nickname}</Text>
                    {member.role === 'leader' && (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>방장</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.statusText}>
                    {member.status === 'joined' ? '참여 중' : 
                     member.status === 'invited' ? '초대됨' : '거절함'}
                  </Text>
                </View>

                {member.status === 'joined' && (
                  <Ionicons name="checkmark-circle" size={20} color="#3182F6" />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
},
  content: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '60%',
    padding: 24
},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
},
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
},
  closeBtn: {
    padding: 4
},
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
},
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B95A1'
},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
},
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333D4B'
},
  leaderBadge: {
    backgroundColor: '#E8F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
},
  leaderBadgeText: {
    fontSize: 10,
    color: '#1B64DA',
    fontWeight: 'bold'
},
  statusText: {
    fontSize: 13,
    color: '#8B95A1',
    marginTop: 2
}
});