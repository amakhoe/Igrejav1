'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Unico usuário permitido para login no sistema
export const ALLOWED_ADMIN_EMAIL = 'pastor.maputo@nazareno.mz';
export const DEFAULT_ADMIN_PASSWORD = 'NazarenoMaputo#2026';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  error: null,
  clearError: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Garantir que apenas o usuário permitido tem sessão ativa autorizada
      if (currentUser && currentUser.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        setUser(currentUser);
      } else if (currentUser) {
        // Se outro usuário logou, desconectar imediatamente
        fbSignOut(auth);
        setUser(null);
        setError('Acesso negado. Apenas o utilizador pastor.maputo@nazareno.mz está autorizado.');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailInput: string, passwordInput: string) => {
    setError(null);
    const cleanEmail = emailInput.trim().toLowerCase();

    // Verificação estrita: apenas o usuário único autorizado
    if (cleanEmail !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`Acesso não autorizado. Apenas o email '${ALLOWED_ADMIN_EMAIL}' tem permissão de entrada.`);
    }

    try {
      // Tentar login normal com email e password
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
      setUser(cred.user);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      // Se a conta ainda não foi criada no Firebase Auth deste projeto, provisionamos automaticamente com a senha padrão
      if (
        (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') &&
        passwordInput === DEFAULT_ADMIN_PASSWORD
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
          setUser(newCred.user);
          return;
        } catch (createErr: unknown) {
          const cErr = createErr as { code?: string; message?: string };
          // Se já existe mas a senha era inválida, reportamos erro claro
          if (cErr.code === 'auth/email-already-in-use') {
            throw new Error('Palavra-passe incorreta para este utilizador.');
          }
          throw new Error('Erro de autenticação no Firebase: ' + (cErr.message || 'Verifique se o método Email/Password está ativo no console.'));
        }
      }

      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        throw new Error('Palavra-passe incorreta. Utilize a credencial fornecida.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas falhadas. Aguarde alguns instantes antes de tentar novamente.');
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        throw new Error('O provedor Email/Password precisa estar ativado no Firebase Console.');
      } else {
        throw new Error(firebaseError.message || 'Erro ao autenticar. Verifique suas credenciais.');
      }
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
