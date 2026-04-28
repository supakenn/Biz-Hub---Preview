import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from "../demo-services/cloud-provider";
import { demoDb } from "../demo-services/cloud-provider";
import { useAuth } from "../demo-services/state-manager";

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { currentUser } = useAuth();
  
  // The user's role access map: { "biz_123": "owner", "biz_456": "manager" }
  const [memberships, setMemberships] = useState({});
  const [userData, setUserData] = useState(null);
  
  // The currently active hierarchy
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [currentBranchId, setCurrentBranchId] = useState(null); // Will be set when opening Biz POS
  
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    // If demoAuth is still loading (undefined), wait
    if (currentUser === undefined) return;

    if (!currentUser || !currentUser.uid || !demoDb) {
      setMemberships({});
      setCurrentBusinessId(null);
      setCurrentBranchId(null);
      setLoadingWorkspace(false);
      return;
    }

    setLoadingWorkspace(true);
    
    // Listen to the user's document to get their business memberships
    const unsubscribe = onSnapshot(
      doc(demoDb, 'users', currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          const userMemberships = data.memberships || {};
          setMemberships(userMemberships);

          // Auto-select the first business if they have one and haven't selected one yet
          const bizIds = Object.keys(userMemberships);
          if (bizIds.length > 0 && !currentBusinessId) {
            setCurrentBusinessId(bizIds[0]);
          }
        }
        setLoadingWorkspace(false);
      },
      (error) => {
        console.error("Workspace Auth Sync Error:", error);
        setLoadingWorkspace(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, currentBusinessId]);

  const value = {
    memberships,
    userData,
    currentBusinessId,
    setCurrentBusinessId,
    currentBranchId,
    setCurrentBranchId,
    loadingWorkspace
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {!loadingWorkspace && children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
