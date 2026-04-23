import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  invites: any[];
  onRespond: (invitationId: string, action: 'accepted' | 'rejected') => void; 
}

export default function NotificationModal({ 
  visible, 
  onClose, 
  invites,
  onRespond
}: NotificationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>알림</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1A1F27" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {invites.length > 0 ? (
              invites.map((invite) => (
                <View key={invite.invitationId} style={styles.inviteItem}> 
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteText}>
                      <Text style={{fontWeight: 'bold'}}>{invite.fromNickname}</Text>님이 {"\n"}
                      <Text style={{color: '#3182F6', fontWeight: 'bold'}}>{invite.challengeTitle}</Text>에 초대했습니다.
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.declineBtn}
                      // 거절 버튼 누르면 'rejected' 전달
                      onPress={() => onRespond(invite.invitationId, 'rejected')} 
                    >
                      <Text style={styles.declineText}>거절</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.acceptBtn}
                      // 수락 버튼 누르면 'accepted' 전달
                      onPress={() => onRespond(invite.invitationId, 'accepted')} 
                    >
                      <Text style={styles.acceptText}>수락</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color="#D1D6DB" />
                <Text style={styles.emptyText}>새로운 알림이 없습니다.</Text>
              </View>
            )}
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
    height: '70%', 
    padding: 24 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  inviteItem: { 
    backgroundColor: '#F9FAFB', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 12 
  },
  inviteInfo: { 
    marginBottom: 16 
  },
  inviteText: { 
    fontSize: 15, 
    color: '#333D4B', 
    lineHeight: 22 
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 10 
  },
  acceptBtn: { 
    flex: 1, 
    backgroundColor: '#3182F6', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  acceptText: { 
    color: '#FFF', 
    fontWeight: 'bold' 
  },
  declineBtn: { 
    flex: 1, 
    backgroundColor: '#E5E8EB', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  declineText: { 
    color: '#4E5968', 
    fontWeight: 'bold' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 60 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#8B95A1', 
    marginTop: 16 
  }
});