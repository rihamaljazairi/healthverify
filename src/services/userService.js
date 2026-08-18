import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

export const getUserById = async (uid) => {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("getUserById error:", error);
    return null;
  }
};

export const listenToUser = (uid, callback) => {
  if (!uid) return () => {};

  const ref = doc(db, "users", uid);

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("listenToUser error:", error);
      callback(null);
    }
  );
};