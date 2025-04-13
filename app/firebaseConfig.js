// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCrvuyKrP7O_blElqvNxw5-ZmPqNguZkxE",
  authDomain: "technology-transferred-p-9f67f.firebaseapp.com",
  databaseURL: "https://technology-transferred-p-9f67f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "technology-transferred-p-9f67f",
  storageBucket: "technology-transferred-p-9f67f.firebasestorage.app",
  messagingSenderId: "325512188856",
  appId: "1:325512188856:web:f44bda96dbde0d2ee9b54d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db};