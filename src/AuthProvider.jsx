// src/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // firebase auth user
  const [profile, setProfile] = useState(null); // user document from Firestore
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // load user doc from 'users' collection
        const uRef = doc(db, "users", user.uid);
        const snap = await getDoc(uRef);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // if no doc, create a default one
          const defaultDoc = {
            username: user.displayName || user.email.split("@")[0],
            flavorProfile: { spiciness: 5, savory: 5, sweetness: 5 },
            followers: [],
            following: [],
            createdAt: new Date().toISOString(),
          };
          await setDoc(uRef, defaultDoc);
          setProfile(defaultDoc);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, setProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
