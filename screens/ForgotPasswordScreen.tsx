import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const KLM_BLUE = '#00A1E4';
const LIGHT_GRAY = '#F2F8FC';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent!');
      setError('');
    } catch (err: any) {
      setError(err.message);
      setMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Reset Password</Text>

        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: KLM_BLUE,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: KLM_BLUE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  success: {
    color: 'green',
    marginBottom: 12,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
