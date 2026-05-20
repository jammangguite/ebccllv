import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  setDoc, 
  doc, 
  deleteDoc, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Member, SyncOp } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper mandated by the skill
export async function testFirestoreConnection(): Promise<void> {
  const testPath = 'test/connection';
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDoc(testDocRef);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    handleFirestoreError(error, OperationType.GET, testPath);
  }
}

// Fetch all members from Firebase Firestore
export async function fetchMembersFromFirestore(): Promise<Member[]> {
  const path = 'members';
  try {
    const collRef = collection(db, path);
    const snapshot = await getDocs(collRef);
    const result: Member[] = [];
    snapshot.forEach((docSnap) => {
      result.push(docSnap.data() as Member);
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Save or Update a member in Firebase Firestore
export async function upsertMemberToFirestore(member: Member): Promise<void> {
  const path = `members/${member.id}`;
  try {
    const docRef = doc(db, 'members', member.id);
    await setDoc(docRef, member);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a member in Firebase Firestore
export async function deleteMemberFromFirestore(id: string): Promise<void> {
  const path = `members/${id}`;
  try {
    const docRef = doc(db, 'members', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Batch Sync offline edits queue to Firebase Firestore
export async function batchSyncToFirestore(ops: SyncOp[]): Promise<void> {
  const path = 'members';
  try {
    const batch = writeBatch(db);
    for (const op of ops) {
      if (op.action === 'upsert' && op.member) {
        const docRef = doc(db, 'members', op.member.id);
        batch.set(docRef, op.member);
      } else if (op.action === 'delete' && op.id) {
        const docRef = doc(db, 'members', op.id);
        batch.delete(docRef);
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
