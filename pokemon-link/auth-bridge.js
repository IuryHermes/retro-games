import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey:'AIzaSyCx_OllbDYkua9BbMOj2oJP5V1UcbxmnbI',
  authDomain:'neoterminalroom.firebaseapp.com',
  projectId:'neoterminalroom'
};
const app = getApps()[0] || initializeApp(firebaseConfig);
onAuthStateChanged(getAuth(app), async user => {
  if (user) sessionStorage.setItem('neo_account_access', await user.getIdToken());
  window.dispatchEvent(new CustomEvent('neo-auth-ready', { detail:{ signedIn:Boolean(user) } }));
});
