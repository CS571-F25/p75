// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";       
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQcU2hUXYWN4-1coeG0IDGWpv6pQsujF0",
  authDomain: "tastebuds-5b247.firebaseapp.com",
  projectId: "tastebuds-5b247",
  storageBucket: "tastebuds-5b247.firebasestorage.app",
  messagingSenderId: "787948159204",
  appId: "1:787948159204:web:f96b158aaebca824666cf1",
  measurementId: "G-DJG67FMCV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
//export const storage = getStorage(app);