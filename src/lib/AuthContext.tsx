import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, ADMIN_EMAIL, testConnection, getCachedAccessToken, setCachedAccessToken } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  accessToken: string | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ user: User; accessToken: string | null }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  accessToken: null,
  isAdmin: false,
  loading: true,
  signInWithGoogle: async () => ({ user: null as any, accessToken: null }),
  signOut: async () => {},
  getAccessToken: async () => null,
  isAdminModalOpen: false,
  setIsAdminModalOpen: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [loading, setLoading] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    // Validate Firestore connection on boot
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setCachedAccessToken(null);
        setAccessToken(null);
      } else {
        setAccessToken(getCachedAccessToken());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = Boolean(
    currentUser &&
    (currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );

  const handleSignIn = async () => {
    try {
      const res = await loginWithGoogle();
      setAccessToken(res.accessToken);
      return res;
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setAccessToken(null);
      setIsAdminModalOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const getValidAccessToken = async (): Promise<string | null> => {
    const cached = getCachedAccessToken();
    if (cached) return cached;
    if (!currentUser) return null;
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        accessToken,
        isAdmin,
        loading,
        signInWithGoogle: handleSignIn,
        signOut: handleSignOut,
        getAccessToken: getValidAccessToken,
        isAdminModalOpen,
        setIsAdminModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
