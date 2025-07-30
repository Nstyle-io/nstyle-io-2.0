import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { firestore } from './config';

export class FirestoreService {
  // Add a document to a collection
  static async addDocument(collectionName: string, data: DocumentData) {
    try {
      const docRef = await addDoc(collection(firestore, collectionName), data);
      return { id: docRef.id, error: null };
    } catch (error: any) {
      return { id: null, error: error.message };
    }
  }

  // Update a document
  static async updateDocument(collectionName: string, documentId: string, data: DocumentData) {
    try {
      const docRef = doc(firestore, collectionName, documentId);
      await updateDoc(docRef, data);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Delete a document
  static async deleteDocument(collectionName: string, documentId: string) {
    try {
      await deleteDoc(doc(firestore, collectionName, documentId));
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get a single document
  static async getDocument(collectionName: string, documentId: string) {
    try {
      const docRef = doc(firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { 
          data: { id: docSnap.id, ...docSnap.data() }, 
          error: null 
        };
      } else {
        return { data: null, error: 'Document not found' };
      }
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // Get multiple documents with query
  static async getDocuments(
    collectionName: string, 
    constraints: QueryConstraint[] = []
  ) {
    try {
      const q = query(collection(firestore, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { data: docs, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  }

  // Helper methods for common queries
  static whereEqual(field: string, value: any) {
    return where(field, '==', value);
  }

  static orderByField(field: string, direction: 'asc' | 'desc' = 'asc') {
    return orderBy(field, direction);
  }

  static limitResults(count: number) {
    return limit(count);
  }
}