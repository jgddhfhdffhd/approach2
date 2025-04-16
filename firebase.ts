// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔐 你的 Firebase 配置（从 Firebase 控制台获取）
const firebaseConfig = {
  apiKey: 'YOUR_RAPIDAPI_KEY_HERE',
  authDomain: 'approach-d1090.firebaseapp.com',
  projectId: 'approach-d1090',
  storageBucket: 'approach-d1090.firebasestorage.app',
  messagingSenderId: '890847109147',
  appId: '1:890847109147:web:d2cada59533b3e12ac58be',
};

// ✅ 初始化 Firebase 应用
const app = initializeApp(firebaseConfig);

// ✅ 导出 Firebase 功能模块（统一命名）
const auth = getAuth(app);           // 身份认证
const db = getFirestore(app);        // Firestore 数据库
const storage = getStorage(app);     // Firebase Storage（云存储）

// ✅ 统一导出
export { app, auth, db, storage };
