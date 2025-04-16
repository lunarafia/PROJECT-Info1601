import {doc, setDoc, getDoc, updateDoc} from 'firebase/firestore';
import {firestore} from './firebase.js';

async function storeUserData(userID, username, password){
    const userDoc = doc(firestore, 'users', userID);
    return setDoc(userDoc, {username, password});
}
async function readUserData(userID){
    const userDoc = doc(firestore, 'users', userID);
    return getDoc(userDoc);
}
async function updateUserData(userID, updates){
    const userDoc = doc(firestore, 'users', userID);
    return updateDoc(userDoc, updates);
}
async function deleteUserData(userID){
    const userDoc = doc(firestore, 'users', userID);
    return deleteDoc(userDoc);
}
export {storeUserData, readUserData, updateUserData, deleteUserData};