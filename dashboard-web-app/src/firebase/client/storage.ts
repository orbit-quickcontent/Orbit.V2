import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask
} from "firebase/storage";
import { storage } from "./app";

export const storageService = {
  uploadFile: (
    path: string,
    file: Blob | Uint8Array | ArrayBuffer,
    customMetadata?: { [key: string]: string }
  ): UploadTask => {
    const fileRef = ref(storage, path);
    return uploadBytesResumable(fileRef, file, { customMetadata });
  },
  getURL: async (path: string): Promise<string> => {
    const fileRef = ref(storage, path);
    return getDownloadURL(fileRef);
  },
  deleteFile: async (path: string): Promise<void> => {
    const fileRef = ref(storage, path);
    return deleteObject(fileRef);
  }
};
