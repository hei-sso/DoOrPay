import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (uid: string) => void;
  uid: string;
  setUid: (value: string) => void;
}

export default function InviteMemberModal({ 
  visible, 
  onClose, 
  onSubmit, 
  uid, 
  setUid 
}: InviteMemberModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Text style={styles.title}>멤버 초대하기</Text>
          <Text style={styles.subTitle}>초대할 사용자의 UID를 입력해주세요.</Text>
          <TextInput
            style={styles.input}
            placeholder="사용자 UID 입력"
            autoFocus
            value={uid}
            onChangeText={setUid}
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={() => onSubmit(uid)}>
              <Text style={styles.submitText}>초대장 보내기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  content: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 24 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1A1F27', 
    marginBottom: 8 
  },
  subTitle: { 
    fontSize: 14, 
    color: '#8B95A1', 
    marginBottom: 20 
  },
  input: { 
    fontSize: 16, 
    borderBottomWidth: 2, 
    borderBottomColor: '#3182F6', 
    paddingVertical: 10, 
    marginBottom: 24, 
    color: '#1A1F27' 
  },
  btnRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  cancelBtn: { 
    flex: 1, 
    backgroundColor: '#F2F4F6', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  cancelText: { 
    color: '#4E5968', 
    fontWeight: '600' 
  },
  submitBtn: { 
    flex: 2, 
    backgroundColor: '#3182F6', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  submitText: { 
    color: '#FFF', 
    fontWeight: 'bold' 
  }
});