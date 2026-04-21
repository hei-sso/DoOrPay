import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
  secureTextEntry?: boolean;
}

export const AuthInput = ({ secureTextEntry, ...props }: AuthInputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} secureTextEntry={secureTextEntry && !isVisible} {...props} />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setIsVisible(!isVisible)}>
          <MaterialIcons name={isVisible ? "visibility" : "visibility-off"} size={22} color="#888" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F9',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000'
  }
});