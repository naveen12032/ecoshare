import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

async function inspect() {
  const config = JSON.parse(readFileSync(join(process.cwd(), 'firebase-config.json'), 'utf8'));
  const app = initializeApp(config);
  const db = getFirestore(app);
  
  console.log("Fetching users from Firestore...");
  const usersSnapshot = await getDocs(collection(db, "users"));
  usersSnapshot.forEach((doc) => {
    console.log("User doc ID:", doc.id);
    console.log(doc.data());
  });

  console.log("\nFetching resources from Firestore...");
  const querySnapshot = await getDocs(collection(db, "resources"));
  querySnapshot.forEach((doc) => {
    console.log("----------------------------------------");
    console.log(`Document ID: ${doc.id}`);
    const data = doc.data();
    console.log(`Title: ${data.title}`);
    console.log(`Category: ${data.category}`);
    console.log(`Status: ${data.status}`);
    console.log(`Owner ID: ${data.ownerId}`);
    console.log(`Owner Name: ${data.ownerName}`);
    console.log(`Image URL length: ${data.imageUrl ? data.imageUrl.length : 0}`);
    console.log(`Image URL snippet: ${data.imageUrl ? data.imageUrl.substring(0, 100) : 'none'}`);
  });
  console.log("----------------------------------------");
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
