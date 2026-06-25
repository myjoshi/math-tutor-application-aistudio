import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import config from "../../firebase-applet-config.json";

// Initialize Firebase with the auto-generated configurations
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore. Note that we pass the custom database ID from config if defined
export const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

// Helper to save student profile
export async function saveStudentProfile(profile: any) {
  try {
    const docRef = doc(db, "students", "default_student");
    await setDoc(docRef, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving student profile to Firestore: ", error);
  }
}

// Helper to load student profile
export async function loadStudentProfile(): Promise<any | null> {
  try {
    const docRef = doc(db, "students", "default_student");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error("Error loading student profile from Firestore: ", error);
  }
  return null;
}

// Helper to save all quiz results (assessments)
export async function saveQuizResult(quizResult: any) {
  try {
    const docRef = doc(db, "quiz_results", quizResult.id || `quiz_${Date.now()}`);
    await setDoc(docRef, {
      ...quizResult,
      id: quizResult.id || `quiz_${Date.now()}`,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving quiz result to Firestore: ", error);
  }
}

// Helper to load all quiz results
export async function loadQuizResults(): Promise<any[]> {
  try {
    const colRef = collection(db, "quiz_results");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push(data);
    });
    return results;
  } catch (error) {
    console.error("Error loading quiz results from Firestore: ", error);
    // Return empty or fallback to offline if index is not built yet
    try {
      const colRef = collection(db, "quiz_results");
      const querySnapshot = await getDocs(colRef);
      const results: any[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data());
      });
      // Sort manually in case orderBy needs index creation
      return results.sort((a, b) => {
        const timeA = a.id ? parseInt(a.id.split("_")[1]) || 0 : 0;
        const timeB = b.id ? parseInt(b.id.split("_")[1]) || 0 : 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("Fallback query failed: ", e);
    }
  }
  return [];
}

// Helper to save scan results
export async function saveScanResult(scan: any) {
  try {
    const docRef = doc(db, "scan_results", scan.id || `scan_${Date.now()}`);
    await setDoc(docRef, {
      ...scan,
      id: scan.id || `scan_${Date.now()}`,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving scan result to Firestore: ", error);
  }
}

// Helper to load all scan results
export async function loadScanResults(): Promise<any[]> {
  try {
    const colRef = collection(db, "scan_results");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((docSnap) => {
      results.push(docSnap.data());
    });
    return results;
  } catch (error) {
    console.error("Error loading scan results from Firestore: ", error);
    try {
      const colRef = collection(db, "scan_results");
      const querySnapshot = await getDocs(colRef);
      const results: any[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data());
      });
      return results.sort((a, b) => {
        const timeA = a.id ? parseInt(a.id.split("_")[1]) || 0 : 0;
        const timeB = b.id ? parseInt(b.id.split("_")[1]) || 0 : 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error("Fallback scan query failed: ", e);
    }
  }
  return [];
}

// Helper to reset/clear database
export async function clearAllFirebaseData() {
  try {
    // Delete profile document
    const profileRef = doc(db, "students", "default_student");
    await deleteDoc(profileRef);

    // Note: We can't easily query and delete collections without retrieving docs first on web SDK
    const quizCol = collection(db, "quiz_results");
    const quizSnaps = await getDocs(quizCol);
    for (const d of quizSnaps.docs) {
      await deleteDoc(doc(db, "quiz_results", d.id));
    }

    const scanCol = collection(db, "scan_results");
    const scanSnaps = await getDocs(scanCol);
    for (const d of scanSnaps.docs) {
      await deleteDoc(doc(db, "scan_results", d.id));
    }
  } catch (error) {
    console.error("Error resetting Firestore data: ", error);
  }
}
