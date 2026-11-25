import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { USE_MOCK } from "./http";
import { getFirebase } from "./firebase";

export async function uploadAvatar(userId, file) {
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    throw new Error("Profile photos must be images no larger than 10 MB.");
  }
  if (USE_MOCK) return null;
  const { storage } = getFirebase();
  const name = `${Date.now()}-${file.name.replace(/[\\/]/g, "_")}`;
  const storageRef = ref(storage, `users/${userId}/avatar/${name}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function deleteAvatar(url) {
  if (USE_MOCK || !url) return;
  const { storage } = getFirebase();
  await deleteObject(ref(storage, url));
}
