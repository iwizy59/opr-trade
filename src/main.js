import './styles.css';
import {
  getSession, onAuthStateChange,
  showLoginScreen, hideLoginScreen, setLoginMsg,
  showMagicLinkForm, showPasswordForm,
  signInWithPassword as _signInWithPassword,
  sendMagicLink as _sendMagicLink,
} from './auth.js';
import {
  load, saveTrade, deleteTrade, exportData, importData,
  switchTab, viewHistoryStrategy, backToHistory, toggleHistoryFilter,
  deleteArchivedStrategy, openNewStrategyModal, confirmNewStrategy,
} from './app.js';
import { openModal, closeModal, handleOverlayClick, selectOpt, closeStrategyModal } from './modal.js';

// Expose functions called from HTML onclick attributes
Object.assign(window, {
  openModal, closeModal, handleOverlayClick, selectOpt,
  saveTrade, deleteTrade, exportData, importData,
  switchTab, viewHistoryStrategy, backToHistory, toggleHistoryFilter,
  deleteArchivedStrategy, openNewStrategyModal, confirmNewStrategy, closeStrategyModal,
  showMagicLinkForm, showPasswordForm,
});

window.signInWithPassword = async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { setLoginMsg('⚠ Remplis tous les champs'); return; }
  setLoginMsg('Connexion...');
  const { error } = await _signInWithPassword(email, password);
  if (error) setLoginMsg('⚠ Email ou mot de passe incorrect');
};

window.sendMagicLink = async () => {
  const email = document.getElementById('login-email-magic').value.trim();
  if (!email) return;
  setLoginMsg('Envoi en cours...');
  const { error } = await _sendMagicLink(email);
  if (error) {
    setLoginMsg('⚠ Erreur : ' + error.message);
  } else {
    setLoginMsg('✓ Lien envoyé ! Vérifie ta boîte mail.');
  }
};

onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    hideLoginScreen();
    load();
  }
});

async function init() {
  const session = await getSession();
  if (session) {
    hideLoginScreen();
    await load();
  } else {
    showLoginScreen();
  }
}

init();
