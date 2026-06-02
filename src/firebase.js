import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBG-SFgQUcbJwaKP1upYhw1GkXiaJSBtIY",
    authDomain: "mappin-e444e.firebaseapp.com",
    projectId: "mappin-e444e",
    storageBucket: "mappin-e444e.firebasestorage.app",
    messagingSenderId: "92166374745",
    appId: "1:92166374745:web:f43ae585b3e8df2b0cb848",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);