// Firebase wrapper (Firestore). Fill in your project config below.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let app = null;
export let db = null;

const firebaseConfig = {
  apiKey: "AIzaSyAynhGcrFFdtOsJjuTdWJw0d5wioZT3C0o",
  authDomain: "loud-librarian-experiment.firebaseapp.com",
  projectId: "loud-librarian-experiment",
  storageBucket: "loud-librarian-experiment.firebasestorage.app",
  messagingSenderId: "455956203407",
  appId: "1:455956203407:web:4415e98244888aaf5cedfa"
};

export async function initFirebase(){
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export function meRef(){
  // pseudo client id using localStorage
  let id = localStorage.getItem('ll_me');
  if(!id){ id = Math.random().toString(36).slice(2,10); localStorage.setItem('ll_me', id); }
  return { id };
}

export function roomRef(roomId){
  return doc(db, 'rooms', roomId);
}

export { onSnapshot, doc, setDoc, updateDoc, getDoc, arrayUnion, serverTimestamp };
