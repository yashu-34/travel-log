"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  googleLogin: () => Promise<void>;

  logout: () => Promise<void>;

  resetPassword: (
    email: string
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

    const login = async (
    email: string,
    password: string
    ): Promise<void> => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("ログインエラー:", error);
        throw error;
    }
    };

    const register = async (
    name: string,
    email: string,
    password: string
    ): Promise<void> => {
    try {
        // Firebase Authentication にユーザーを作成
        const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
        );

        const firebaseUser = userCredential.user;

        // Firestore にユーザー情報を保存
        await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        name,
        email,
        photoURL: firebaseUser.photoURL ?? "",
        createdAt: serverTimestamp(),
        });

    } catch (error) {
        console.error("新規登録エラー:", error);
        throw error;
    }
    };

    const googleLogin = async (): Promise<void> => {
    try {
        const provider = new GoogleAuthProvider();

        const result = await signInWithPopup(auth, provider);

        const firebaseUser = result.user;

        const userRef = doc(db, "users", firebaseUser.uid);

        const userSnap = await getDoc(userRef);

        // 初回ログインのみ Firestore に保存
        if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName ?? "",
            email: firebaseUser.email ?? "",
            photoURL: firebaseUser.photoURL ?? "",
            createdAt: serverTimestamp(),
        });
        }
    } catch (error) {
        console.error("Googleログインエラー:", error);
        throw error;
    }
    };

    const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("ログアウトエラー:", error);
        throw error;
    }
    };

    const resetPassword = async (
    email: string
    ): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("パスワードリセットエラー:", error);
        throw error;
    }
    };

return (
  <AuthContext.Provider
    value={{
      user,
      loading,
      login,
      register,
      googleLogin,
      logout,
      resetPassword,
    }}
  >
    {children}
  </AuthContext.Provider>
);
}