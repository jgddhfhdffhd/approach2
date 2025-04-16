// src/services/authService.ts
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';

export const registerUser = async (email: string, password: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // 注册成功后的处理
  } catch (error) {
    console.error(error);
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // 登录成功后的处理
  } catch (error) {
    console.error(error);
  }
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};
