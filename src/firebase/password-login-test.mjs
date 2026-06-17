import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(__dirname, './service-account.json'), 'utf-8'));

const firebaseConfig = {
    apiKey: 'AIzaSyBPgiiemlpofwUChSSNZ6gzaq3NTris6mk',
    authDomain: 'g-tree-app-testing.firebaseapp.com',
    projectId: 'g-tree-app-testing'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function login() {
    const userCredential = await signInWithEmailAndPassword(auth, 'test1@gmail.com', 'test123');

    const token = await userCredential.user.getIdToken();

    console.log(token);

    const decoded = await admin.auth().verifyIdToken(token);

    console.log(decoded);
}

login();
