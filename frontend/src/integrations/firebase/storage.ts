import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { firebaseStorage } from './config';

export class FirebaseStorageService {
  // Upload a file
  static async uploadFile(path: string, file: File) {
    try {
      const storageRef = ref(firebaseStorage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { 
        url: downloadURL, 
        path: snapshot.ref.fullPath,
        error: null 
      };
    } catch (error: any) {
      return { url: null, path: null, error: error.message };
    }
  }

  // Upload file with progress tracking
  static uploadFileWithProgress(
    path: string, 
    file: File,
    onProgress?: (progress: number) => void
  ) {
    const storageRef = ref(firebaseStorage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          reject({ url: null, path: null, error: error.message });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              path: uploadTask.snapshot.ref.fullPath,
              error: null
            });
          } catch (error: any) {
            reject({ url: null, path: null, error: error.message });
          }
        }
      );
    });
  }

  // Delete a file
  static async deleteFile(path: string) {
    try {
      const storageRef = ref(firebaseStorage, path);
      await deleteObject(storageRef);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get download URL for a file
  static async getDownloadURL(path: string) {
    try {
      const storageRef = ref(firebaseStorage, path);
      const url = await getDownloadURL(storageRef);
      return { url, error: null };
    } catch (error: any) {
      return { url: null, error: error.message };
    }
  }

  // List all files in a directory
  static async listFiles(path: string) {
    try {
      const storageRef = ref(firebaseStorage, path);
      const result = await listAll(storageRef);
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url
          };
        })
      );
      
      return { files, error: null };
    } catch (error: any) {
      return { files: [], error: error.message };
    }
  }
}