import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCroWs12CkW4st_dxv90YdSfP_hOLMlcas",
  authDomain: "whattowatch-4343a.firebaseapp.com",
  projectId: "whattowatch-4343a",
  storageBucket: "whattowatch-4343a.firebasestorage.app",
  messagingSenderId: "126583346688",
  appId: "1:126583346688:web:643129fc31219a20c92ae5",
  measurementId: "G-24ZNV9J8EZ"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export {firestore};