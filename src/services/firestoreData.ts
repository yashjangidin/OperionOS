import { collection, doc, getDocs, getDoc, getFirestore, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { firebaseApp } from "./firebaseAuth";

type RemoteRecord = Record<string, unknown>;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const hasFirestore = Boolean(db);

const userDocId = (email: string) => email.trim().toLowerCase();

function requireDb() {
  if (!db) throw new Error("Firestore is not configured.");
  return db;
}

export async function getRemoteUserProfile<T extends RemoteRecord>(email: string): Promise<T | null> {
  if (!db || !email.trim()) return null;
  const snapshot = await getDoc(doc(db, "operionUserProfiles", userDocId(email)));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null;
}

export async function saveRemoteUserProfile(profile: RemoteRecord & { email: string }) {
  const firestore = requireDb();
  await setDoc(
    doc(firestore, "operionUserProfiles", userDocId(profile.email)),
    {
      ...profile,
      email: userDocId(profile.email),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createRemoteWorkspace(
  owner: RemoteRecord & { email: string; name: string; workspaceId?: string },
  initialData: RemoteRecord,
) {
  const firestore = requireDb();
  const workspaceId =
    owner.workspaceId ||
    `ws-${userDocId(owner.email).replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  await setDoc(
    doc(firestore, "operionWorkspaces", workspaceId),
    {
      id: workspaceId,
      ownerEmail: userDocId(owner.email),
      ownerName: owner.name,
      ...initialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await saveRemoteUserProfile({ ...owner, role: "employer", workspaceId });
  return workspaceId;
}

export async function getRemoteWorkspace<T extends RemoteRecord>(workspaceId: string): Promise<T | null> {
  if (!db || !workspaceId) return null;
  const snapshot = await getDoc(doc(db, "operionWorkspaces", workspaceId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null;
}

export async function saveRemoteWorkspacePatch(workspaceId: string, patch: RemoteRecord) {
  const firestore = requireDb();
  await setDoc(
    doc(firestore, "operionWorkspaces", workspaceId),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getRemoteWorkspaceMembers<T extends RemoteRecord>(workspaceId: string): Promise<T[]> {
  if (!db || !workspaceId) return [];
  const snapshots = await getDocs(query(collection(db, "operionUserProfiles"), where("workspaceId", "==", workspaceId)));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as unknown as T);
}
