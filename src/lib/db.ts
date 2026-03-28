import { db } from "./firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  or,
  where,
  getDocs,
} from "firebase/firestore";

// --- Users ---
export const getUser = async (uid: string) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createUser = async (uid: string, data: any) =>
  setDoc(doc(db, "users", uid), data);

export const updateUser = async (uid: string, data: any) =>
  updateDoc(doc(db, "users", uid), data);

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getOtherUsers = async (uid: string) => {
  const q = query(collection(db, "users"), where("uid", "!=", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ✅ NEW: Phone number se user dhundho
export const getUserByPhone = async (phoneNumber: string) => {
  const q = query(
    collection(db, "users"),
    where("phoneNumber", "==", phoneNumber),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// --- Chats ---
export const getUserChats = async (uid: string) => {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeToUserChatsWithDetails = (
  uid: string,
  callback: (chats: any[]) => void,
) => {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(q, async (snapshot) => {
    const fetchedChats = await Promise.all(
      snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        if (data.type === "individual") {
          const otherUserId = data.participants.find(
            (id: string) => id !== uid,
          );
          if (otherUserId) {
            const userSnap = await getDoc(doc(db, "users", otherUserId));
            if (userSnap.exists()) {
              return { ...data, ...userSnap.data(), id: chatDoc.id };
            }
          }
        }
        return { ...data, id: chatDoc.id };
      }),
    );
    callback(fetchedChats);
  });
};

export const subscribeToChatDetails = (
  chatId: string,
  currentUserId: string,
  callback: (chat: any, typingUsers: string[]) => void,
) => {
  return onSnapshot(doc(db, "chats", chatId), async (chatSnap) => {
    if (chatSnap.exists()) {
      const data = chatSnap.data();
      const typing = data.typing || {};
      const activeTypingIds = Object.keys(typing).filter(
        (id) => typing[id] && id !== currentUserId,
      );

      let chatInfo = { ...data, id: chatSnap.id };
      if (data.type === "individual") {
        const otherUserId = data.participants.find(
          (id: string) => id !== currentUserId,
        );
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, "users", otherUserId));
          if (userSnap.exists()) {
            chatInfo = { ...chatInfo, ...userSnap.data() };
          }
        }
      }
      callback(chatInfo, activeTypingIds);
    }
  });
};

export const updateChat = async (chatId: string, data: any) =>
  updateDoc(doc(db, "chats", chatId), data);

export const createChat = async (data: any) => {
  const ref = doc(collection(db, "chats"));
  await setDoc(ref, { ...data, id: ref.id });
  return ref.id;
};

// --- Messages ---
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: any[]) => void,
) => {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
};

export const sendMessage = async (chatId: string, messageData: any) => {
  const ref = doc(collection(db, "chats", chatId, "messages"));
  await setDoc(ref, { ...messageData, id: ref.id });
  return ref.id;
};

export const updateMessage = async (
  chatId: string,
  messageId: string,
  data: any,
) => {
  return updateDoc(doc(db, "chats", chatId, "messages", messageId), data);
};

// --- Calls ---
export const subscribeToCalls = (
  uid: string,
  callback: (calls: any[]) => void,
) => {
  const q = query(
    collection(db, "calls"),
    or(where("receiverId", "==", uid), where("callerId", "==", uid)),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
};

export const createCall = async (callData: any) => {
  const ref = doc(collection(db, "calls"));
  await setDoc(ref, { ...callData, id: ref.id });
  return ref.id;
};

export const updateCall = async (callId: string, data: any) =>
  updateDoc(doc(db, "calls", callId), data);

// --- Statuses ---
export const subscribeToStatuses = (
  twentyFourHoursAgo: string,
  callback: (statuses: any[]) => void,
) => {
  const q = query(
    collection(db, "statuses"),
    where("createdAt", ">=", twentyFourHoursAgo),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
};

export const createStatus = async (statusData: any) => {
  const ref = doc(collection(db, "statuses"));
  await setDoc(ref, { ...statusData, id: ref.id });
  return ref.id;
};