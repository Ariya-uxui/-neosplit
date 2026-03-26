import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
 
const firebaseConfig = {
  apiKey: "AIzaSyBMPHKlH46MtYgDbrvWI7JOtTQvz8QNqG0",
  authDomain: "neosplit127.firebaseapp.com",
  databaseURL: "https://neosplit127-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "neosplit127",
  storageBucket: "neosplit127.firebasestorage.app",
  messagingSenderId: "587085290796",
  appId: "1:587085290796:web:356be8d6fd37bffc41a089",
  measurementId: "G-0D62GDPQW8",
};
 
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
 