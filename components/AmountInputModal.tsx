import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';

interface AmountInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  buttonText: string;
  amount: string;
  setAmount: (value: string) => void;
}

export default function AmountInputModal({ 
  visible, 
  onClose, 
  onSubmit, 
  title, 
  buttonText, 
  amount, 
  setAmount 
}: AmountInputModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="금액 입력"
            keyboardType="number-pad"
            autoFocus
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={onSubmit}>
              <Text style={styles.modalSubmitBtnText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 24 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1A1F27', 
    marginBottom: 20 
  },
  amountInput: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    borderBottomWidth: 2, 
    borderBottomColor: '#3182F6', 
    paddingVertical: 8,
    marginBottom: 24,
    color: '#1A1F27'
  },
  modalBtnRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  modalCancelBtn: { 
    flex: 1, 
    backgroundColor: '#F2F4F6', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  modalCancelBtnText: { 
    color: '#4E5968', 
    fontWeight: '600' 
  },
  modalSubmitBtn: { 
    flex: 2, 
    backgroundColor: '#3182F6', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  modalSubmitBtnText: { 
    color: '#FFF', 
    fontWeight: 'bold' 
  }
});