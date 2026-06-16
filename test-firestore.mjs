import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runTest() {
  console.log("=== ECOSHARE FIRESTORE LIFECYCLE TEST ===");
  
  // Load config
  const configPath = join(process.cwd(), 'firebase-config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  console.log(`Using Project ID: ${config.projectId}`);

  // Initialize
  const app = initializeApp(config);
  const db = getFirestore(app);
  
  // 1. ADD RESOURCE
  console.log("\n1. Testing: Add Resource...");
  const testResource = {
    title: "Node.js Verification Tool",
    description: "Automated verification test item",
    category: "Other",
    quantity: "1 unit",
    imageUrl: "",
    location: "Live Test Center",
    latitude: 45.5152,
    longitude: -122.6784,
    createdAt: new Date().toISOString(),
    status: "Available",
    ownerId: "node_test_owner"
  };

  const docRef = await addDoc(collection(db, "resources"), testResource);
  const resourceId = docRef.id;
  console.log(`√ Resource successfully added! Document ID: ${resourceId}`);

  // 2. QUERY / READ RESOURCE
  console.log("\n2. Testing: Query Resource...");
  const q = query(collection(db, "resources"), where("title", "==", "Node.js Verification Tool"));
  const querySnapshot = await getDocs(q);
  
  let foundDoc = null;
  querySnapshot.forEach((doc) => {
    foundDoc = { id: doc.id, ...doc.data() };
  });

  if (foundDoc && foundDoc.id === resourceId) {
    console.log("√ Resource successfully found and verified in query.");
  } else {
    throw new Error("Failed to find the added resource!");
  }

  // 3. EDIT / UPDATE RESOURCE
  console.log("\n3. Testing: Edit Resource (Status change)...");
  const resourceDocRef = doc(db, "resources", resourceId);
  await updateDoc(resourceDocRef, { status: "Pending" });
  console.log("√ Update command sent.");

  // Verify update
  const verifySnapshot = await getDocs(q);
  let updatedDoc = null;
  verifySnapshot.forEach((doc) => {
    updatedDoc = doc.data();
  });
  if (updatedDoc && updatedDoc.status === "Pending") {
    console.log("√ Resource status successfully verified as 'Pending'.");
  } else {
    throw new Error("Failed to update the resource status!");
  }

  // 4. DELETE RESOURCE
  console.log("\n4. Testing: Delete Resource...");
  await deleteDoc(resourceDocRef);
  console.log("√ Delete command sent.");

  // Verify deletion
  const verifyDelSnapshot = await getDocs(q);
  if (verifyDelSnapshot.empty) {
    console.log("√ Resource successfully deleted and verified as gone.");
  } else {
    throw new Error("Resource was not successfully deleted!");
  }

  console.log("\n==========================================");
  console.log("ALL FIRESTORE LIFECYCLE TESTS PASSED SUCCESSFULLY!");
  console.log("==========================================");
  process.exit(0);
}

runTest().catch(err => {
  console.error("\nTEST FAILED WITH ERROR:", err);
  process.exit(1);
});
