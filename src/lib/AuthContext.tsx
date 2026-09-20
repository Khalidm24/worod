import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, ADMIN_EMAIL, testConnection } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isAdminModalOpen: false,
  setIsAdminModalOpen: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    // Validate Firestore connection on boot
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
      await loginWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setIsAdminModalOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loading,
        signInWithGoogle: handleSignIn,
        signOut: handleSignOut,
        isAdminModalOpen,
        setIsAdminModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
