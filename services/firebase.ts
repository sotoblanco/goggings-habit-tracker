import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================================================
// IMPORTANT: REPLACE THE FOLLOWING WITH YOUR APP'S FIREBASE PROJECT CONFIGURATION
// You can get this from the Firebase Console: Project settings > General > Your apps > Web app
// =================================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDaJtfkBReN6BDrm0ET57ccbztj3oS6MjY",
  authDomain: "googings-8c4d0.firebaseapp.com",
  projectId: "googings-8c4d0",
  storageBucket: "googings-8c4d0.firebasestorage.app",
  messagingSenderId: "700703322695",
  appId: "1:700703322695:web:39767862ce46d51d9cf762",
  measurementId: "G-SHS2151DTT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
