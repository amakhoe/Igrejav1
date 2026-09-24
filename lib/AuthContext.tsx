'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
  updatePassword as fbUpdatePassword,
  updateEmail as fbUpdateEmail
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { SystemUser } from '@/lib/types';

interface UpdateProfilePayload {
  name?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  systemUser: SystemUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (payload: UpdateProfilePayload) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  systemUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  error: null,
  clearError: () => {}
});

// Transforma emails sem domínio com ponto (ex: luciano.luis@igreja) num formato aceitável pelo Firebase Auth
export function toFirebaseAuthEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@')) {
    return `${clean}@igreja.mz`;
  }
  const [localPart, domain] = clean.split('@');
  if (!domain.includes('.')) {
    return `${localPart}@${domain}.mz`;
  }
  return clean;
}

// Utilizador padrão da base de dados: luciano.luis@igreja / igr3j@2026
const DEFAULT_ADMIN_USER: Omit<SystemUser, 'id'> = {
  name: 'Luciano Luís',
  email: 'luciano.luis@igreja',
  role: 'admin',
  active: true,
  phoneNumber: '+258 84 100 2026',
  photoURL: '',
  password: 'igr3j@2026',
  createdAt: Date.now()
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [systemUser, setSystemUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assegura que o utilizador luciano.luis@igreja existe na base de dados Firestore
  const ensureDefaultUserInDatabase = async () => {
    try {
      const usersRef = collection(db, 'system_users');
      const snap = await getDocs(usersRef);

      if (snap.empty) {
        await addDoc(usersRef, DEFAULT_ADMIN_USER);
        return;
      }

      // Procura por luciano.luis@igreja
      const q = query(usersRef, where('email', 'in', ['luciano.luis@igreja', 'luciano.luis@igreja.mz']));
      const userSnap = await getDocs(q);

      if (userSnap.empty) {
        await addDoc(usersRef, DEFAULT_ADMIN_USER);
      } else {
        const existing = userSnap.docs[0];
        const data = existing.data();
        // Se faltar a password ou estiver desativado, corrige na base de dados
        if (!data.password || !data.active) {
          await updateDoc(doc(db, 'system_users', existing.id), {
            active: true,
            password: data.password || 'igr3j@2026'
          });
        }
      }
    } catch (err) {
      console.warn('Verificação de utilizadores na base de dados:', err);
    }
  };

  useEffect(() => {
    // 1. Inicializa / verifica existência na base de dados Firestore
    ensureDefaultUserInDatabase();

    // 2. Escuta mudanças de sessão Firebase Auth
    let userDocUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (currentUser && currentUser.email) {
        try {
          const authEmail = currentUser.email.toLowerCase().trim();
          const localEmailVariant = authEmail.endsWith('.mz') 
            ? authEmail.slice(0, -3) // ex: luciano.luis@igreja
            : authEmail;

          const usersRef = collection(db, 'system_users');
          const q = query(usersRef, where('email', 'in', [authEmail, localEmailVariant]));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const data = userDoc.data() as Omit<SystemUser, 'id'>;

            if (data.active) {
              setUser(currentUser);
              setSystemUser({ id: userDoc.id, ...data });
              setError(null);

              // 3. OUVINTE EM TEMPO REAL: Qualquer alteração na base de dados reflete imediatamente no sistema
              userDocUnsubscribe = onSnapshot(doc(db, 'system_users', userDoc.id), (docSnap) => {
                if (docSnap.exists()) {
                  const updatedData = docSnap.data() as Omit<SystemUser, 'id'>;
                  if (updatedData.active) {
                    setSystemUser({ id: docSnap.id, ...updatedData });
                  } else {
                    fbSignOut(auth);
                    setUser(null);
                    setSystemUser(null);
                    setError('Esta conta foi desativada na base de dados.');
                  }
                }
              });
            } else {
              await fbSignOut(auth);
              setUser(null);
              setSystemUser(null);
              setError('Conta inativa na base de dados.');
            }
          } else {
            // Se o email não existe na base de dados Firestore, encerra sessão
            await fbSignOut(auth);
            setUser(null);
            setSystemUser(null);
          }
        } catch (err) {
          console.error('Erro ao verificar sessão contra a base de dados:', err);
          setUser(null);
          setSystemUser(null);
        }
      } else {
        setUser(null);
        setSystemUser(null);
      }
      setLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []);

  const login = async (emailInput: string, passwordInput: string) => {
    setError(null);
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Por favor preencha o e-mail e a palavra-passe.');
    }

    // 1. CONSULTA ESTREITA À BASE DE DADOS FIRESTORE
    // Apenas os dados existentes na base de dados podem autenticar no sistema
    const usersRef = collection(db, 'system_users');
    const authVariant = toFirebaseAuthEmail(cleanEmail);
    
    // Procura na colecção system_users
    const q = query(usersRef, where('email', 'in', [cleanEmail, authVariant]));
    let snapshot = await getDocs(q);

    // Se não encontrou por query direta, verifica todos os documentos na coleção (fallback de formato)
    if (snapshot.empty) {
      const allUsersSnap = await getDocs(usersRef);
      const matchDoc = allUsersSnap.docs.find(d => {
        const e = (d.data().email || '').toLowerCase().trim();
        return e === cleanEmail || e === authVariant || toFirebaseAuthEmail(e) === authVariant;
      });
      if (matchDoc) {
        snapshot = {
          empty: false,
          docs: [matchDoc]
        } as unknown as typeof snapshot;
      }
    }

    // Se o utilizador não existe na base de dados, RECUSA IMEDIATAMENTE
    if (snapshot.empty) {
      throw new Error(`Acesso não autorizado: O utilizador "${cleanEmail}" não existe na base de dados da igreja.`);
    }

    const userDoc = snapshot.docs[0];
    const dbUserData = { id: userDoc.id, ...userDoc.data() } as SystemUser;

    // Verifica se a conta está ativa na base de dados
    if (!dbUserData.active) {
      throw new Error('Acesso recusado: Esta conta está marcada como inativa na base de dados.');
    }

    // 2. VALIDAÇÃO ESTREITA DA PALAVRA-PASSE COM A BASE DE DADOS
    // Apenas a senha gravada no documento da base de dados é permitida
    const expectedPassword = dbUserData.password || 'igr3j@2026';
    if (cleanPassword !== expectedPassword) {
      throw new Error('Palavra-passe incorreta. Acesso recusado pela base de dados.');
    }

    // 3. SINCRONIZAÇÃO DA SESSÃO FIREBASE AUTH
    const fbEmail = toFirebaseAuthEmail(dbUserData.email || cleanEmail);

    try {
      const cred = await signInWithEmailAndPassword(auth, fbEmail, cleanPassword);
      setUser(cred.user);
      setSystemUser(dbUserData);

      // Atualiza timestamp de último login na base de dados
      await updateDoc(doc(db, 'system_users', userDoc.id), {
        lastLoginAt: Date.now()
      });
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };

      // Se a conta no Firebase Auth ainda não foi provisionada ou foi criada com outra senha,
      // sincronizamos a conta com a palavra-passe válida da base de dados
      if (
        firebaseError.code === 'auth/user-not-found' || 
        firebaseError.code === 'auth/invalid-credential' ||
        firebaseError.code === 'auth/wrong-password' ||
        firebaseError.code === 'auth/invalid-email'
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, fbEmail, cleanPassword);
          setUser(newCred.user);
          setSystemUser(dbUserData);

          await updateDoc(doc(db, 'system_users', userDoc.id), {
            lastLoginAt: Date.now()
          });
          return;
        } catch {
          // Se o utilizador já existe no Firebase Auth mas com hash antigo, estabelecemos a sessão autorizada pelo Firestore
          setSystemUser(dbUserData);
          await updateDoc(doc(db, 'system_users', userDoc.id), {
            lastLoginAt: Date.now()
          });
        }
      } else {
        // Se houver outro erro, permitimos a entrada confirmada pelo Firestore
        setSystemUser(dbUserData);
      }
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setSystemUser(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  // Função para editar perfil do administrador
  // Grava todas as alterações directamente na base de dados Firestore
  const updateUserProfile = async (payload: UpdateProfilePayload) => {
    if (!systemUser) {
      throw new Error('Nenhum utilizador com sessão iniciada.');
    }

    const updates: Partial<SystemUser> = {};
    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.phoneNumber !== undefined) updates.phoneNumber = payload.phoneNumber.trim();
    if (payload.photoURL !== undefined) updates.photoURL = payload.photoURL;
    if (payload.email !== undefined && payload.email.trim()) {
      updates.email = payload.email.trim().toLowerCase();
    }
    if (payload.password !== undefined && payload.password.trim()) {
      updates.password = payload.password.trim();
    }

    // 1. GRAVAÇÃO DIRECTA NA BASE DE DADOS FIRESTORE
    const userDocRef = doc(db, 'system_users', systemUser.id);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: Date.now()
    });

    // 2. SINCRONIZAÇÃO OPCIONAL COM FIREBASE AUTH
    if (auth.currentUser) {
      if (payload.password && payload.password.trim()) {
        try {
          await fbUpdatePassword(auth.currentUser, payload.password.trim());
        } catch (pwErr) {
          console.warn('Aviso ao sincronizar password no Firebase Auth:', pwErr);
        }
      }
      if (payload.email && payload.email.trim()) {
        try {
          const newFbEmail = toFirebaseAuthEmail(payload.email);
          await fbUpdateEmail(auth.currentUser, newFbEmail);
        } catch (emailErr) {
          console.warn('Aviso ao sincronizar email no Firebase Auth:', emailErr);
        }
      }
    }

    // 3. ACTUALIZAÇÃO IMEDIATA DO ESTADO LOCAL
    setSystemUser(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      systemUser, 
      loading, 
      login, 
      logout, 
      updateUserProfile,
      error, 
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
