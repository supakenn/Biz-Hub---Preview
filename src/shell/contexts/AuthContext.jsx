import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "../demo-services/cloud-provider";
import { demoAuth } from "../demo-services/cloud-provider";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(demoAuth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isLoggingIn, setIsLoggingIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
