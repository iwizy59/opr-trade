import { db } from './db.js';

export async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await db.auth.getUser();
  return user;
}

export function signInWithPassword(email, password) {
  return db.auth.signInWithPassword({ email, password });
}

export function sendMagicLink(email) {
  return db.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  });
}

export function onAuthStateChange(callback) {
  db.auth.onAuthStateChange(callback);
}

export function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
}

export function hideLoginScreen() {
  document.getElementById('login-screen').style.display = 'none';
}

export function setLoginMsg(msg) {
  document.getElementById('login-msg').textContent = msg;
}

export function showMagicLinkForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('magic-link-form').style.display = 'block';
  setLoginMsg('');
}

export function showPasswordForm() {
  document.getElementById('magic-link-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  setLoginMsg('');
}
