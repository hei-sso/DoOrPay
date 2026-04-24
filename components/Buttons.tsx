import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// 파란색 버튼
export const PrimaryButton = ({ title, onPress }: { title: string, onPress: () => void }) => (
  <TouchableOpacity style={[styles.btn, { backgroundColor: '#3F51B5' }]} onPress={onPress}>
    <Text style={[styles.text, { color: '#FFF' }]}>{title}</Text>
  </TouchableOpacity>
);

// 연한 배경 버튼
export const SecondaryButton = ({ title, onPress }: { title: string, onPress: () => void }) => (
  <TouchableOpacity style={[styles.btn, { backgroundColor: '#F0F2F9' }]} onPress={onPress}>
    <Text style={[styles.text, { color: '#3F51B5' }]}>{title}</Text>
  </TouchableOpacity>
);

// 구글 로그인 버튼 (아이콘 버전)
export const GoogleButton = ({ title, onPress }: { title: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.googleBtn} onPress={onPress}>
    <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
    <Text style={{ fontSize: 16, fontWeight: '600' }}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: { 
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 8 
  },
  text: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  googleBtn: { 
    height: 55, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#DDD', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    backgroundColor: '#FFF'
  }
});