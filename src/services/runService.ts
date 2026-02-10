import { db } from "./firebase";
import { collection, addDoc, getDoc, doc, serverTimestamp } from "firebase/firestore";

export const saveRunToCloud = async (data: any) => {
  const docRef = await addDoc(collection(db, "runs"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const fetchRunFromCloud = async (id: string) => {
  const docSnap = await getDoc(doc(db, "runs", id));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  throw new Error("Run not found");
};