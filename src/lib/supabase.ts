import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, where, getDocs, limit, doc, setDoc, updateDoc, deleteDoc, getDoc, writeBatch
} from "firebase/firestore";
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged } from "firebase/auth";

// Master Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || 'dummy-api-key-for-build',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "janubhaiconsultancy");
const auth = getAuth(app);

class SupabaseQueryBuilder {
  _collection: string;
  _select: string = '*';
  _limit?: number;
  _eq: { key: string, val: any }[] = [];

  constructor(coll: string) {
    this._collection = coll;
  }

  select(cols: string) { this._select = cols; return this; }
  limit(count: number) { this._limit = count; return this; }
  eq(key: string, val: any) { this._eq.push({ key, val }); return this; }
  or(clause: string) { return this; }
  in(key: string, vals: any[]) { return this; }
  lte(key: string, val: any) { return this; }
  gte(key: string, val: any) { return this; }
  order(key: string, opts: any) { return this; }

  async single() {
    const res = await this.execute();
    return { data: res.data?.[0] || null, error: res.error };
  }
  async maybeSingle() { return this.single(); }

  async execute() {
    try {
      const collRef = collection(db, this._collection);
      let q: any = collRef;
      
      for (const cond of this._eq) {
        if (cond.key === 'id') {
          const d = await getDoc(doc(db, this._collection, cond.val));
          if (d.exists()) {
            return { data: [{ id: d.id, ...d.data() }], error: null };
          }
          return { data: [], error: null };
        }
        q = query(q, where(cond.key, "==", cond.val));
      }
      
      if (this._limit) q = query(q, limit(this._limit));
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async insert(payload: any) {
    try {
      if (Array.isArray(payload)) {
        const batch = writeBatch(db);
        const results = [];
        for (const item of payload) {
          const dRef = doc(collection(db, this._collection));
          batch.set(dRef, item, { merge: true });
          results.push({ id: dRef.id, ...item });
        }
        await batch.commit();
        return { data: results, error: null };
      } else {
        const dRef = payload.id ? doc(db, this._collection, payload.id) : doc(collection(db, this._collection));
        await setDoc(dRef, payload, { merge: true });
        return { data: [{ id: dRef.id, ...payload }], error: null };
      }
    } catch (error) { return { data: null, error }; }
  }

  async update(payload: any) {
    return this.insert(payload);
  }

  async upsert(payload: any) { return this.insert(payload); }
  
  async delete() {
    try {
      const idCond = this._eq.find(c => c.key === 'id');
      if (idCond) {
        await deleteDoc(doc(db, this._collection, idCond.val));
      }
      return { data: null, error: null };
    } catch (error) { return { data: null, error }; }
  }

  then(resolve: any, reject: any) { return this.execute().then(resolve, reject); }
}

export const createClient = () => {
  return {
    auth: {
      getUser: async () => {
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
              resolve({
                data: { user: { id: user.uid, email: user.email, user_metadata: {} } },
                error: null
              });
            } else {
              resolve({ data: { user: null }, error: null });
            }
          });
        });
      },
      getSession: async () => {
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
              resolve({
                data: { session: { user: { id: user.uid, email: user.email } } },
                error: null
              });
            } else {
              resolve({ data: { session: null }, error: null });
            }
          });
        });
      },
      onAuthStateChange: (cb: any) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user: { id: user.uid, email: user.email } } : null);
        });
        return { data: { subscription: { unsubscribe } } };
      },
      signOut: async () => {
        await signOut(auth);
        if (typeof window !== 'undefined') {
          window.location.href = "https://janubhai.space/auth?app=nagrikparty";
        }
        return { error: null };
      }
    },
    from: (table: string) => new SupabaseQueryBuilder(table),
  };
};

export const createApiSupabase = createClient;
export const hasSupabaseConfig = true;
export const supabase = createClient();

