// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZhNpgCdn-UdGvJz_eAyvi8XSw5AVxeoY",
  authDomain: "yarn-tool.firebaseapp.com",
  projectId: "yarn-tool",
  storageBucket: "yarn-tool.firebasestorage.app",
  messagingSenderId: "230621235106",
  appId: "1:230621235106:web:4b98db41113fb842b314fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);