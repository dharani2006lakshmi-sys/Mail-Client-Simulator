/**
 * storage.js — LocalStorage-based backend for MiniMail
 * Acts as a simulated database for users and emails.
 */

const Storage = (() => {

  // ---- KEYS ----
  const USERS_KEY   = 'minimail_users';
  const EMAILS_KEY  = 'minimail_emails';
  const SESSION_KEY = 'minimail_session';

  // ---- HELPERS ----
  const uuid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const now = () => new Date().toISOString();

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // ---- USERS ----
  const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

  const createUser = (name, email, password) => {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { error: 'An account with this email already exists.' };
    }
    const user = { id: uuid(), name, email, password };
    users.push(user);
    saveUsers(users);
    _seedWelcomeEmail(user);
    return { user };
  };

  const findUser = (email, password) => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { error: 'Invalid email or password.' };
    return { user };
  };

  // ---- SESSION ----
  const setSession = (user) =>
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, email: user.email, name: user.name }));

  const getSession = () =>
    JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');

  const clearSession = () =>
    localStorage.removeItem(SESSION_KEY);

  // ---- EMAILS ----
  const getAllEmails = () => JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]');
  const saveEmails = (emails) => localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));

  const sendEmail = ({ fromId, fromName, fromEmail, toEmail, subject, body }) => {
    const users = getUsers();
    const recipient = users.find(u => u.email === toEmail);

    const email = {
      id:        uuid(),
      fromId,
      fromName,
      fromEmail,
      toEmail,
      subject:   subject || '(no subject)',
      body:      body || '',
      date:      now(),
      read:      false,
      starred:   false,
      trashed:   false,
    };

    const emails = getAllEmails();
    emails.push(email);
    saveEmails(emails);

    return { success: true, delivered: !!recipient };
  };

  const getInbox = (userId) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return [];
    return getAllEmails()
      .filter(e => e.toEmail === user.email && !e.trashed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const getSent = (userId) => {
    return getAllEmails()
      .filter(e => e.fromId === userId && !e.trashed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const getStarred = (userId) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return [];
    return getAllEmails()
      .filter(e => e.starred && !e.trashed &&
        (e.toEmail === user.email || e.fromId === userId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const getTrash = (userId) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return [];
    return getAllEmails()
      .filter(e => e.trashed &&
        (e.toEmail === user.email || e.fromId === userId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const markRead = (emailId) => {
    const emails = getAllEmails();
    const e = emails.find(m => m.id === emailId);
    if (e) { e.read = true; saveEmails(emails); }
  };

  const toggleStar = (emailId) => {
    const emails = getAllEmails();
    const e = emails.find(m => m.id === emailId);
    if (e) { e.starred = !e.starred; saveEmails(emails); return e.starred; }
    return false;
  };

  const trashEmail = (emailId) => {
    const emails = getAllEmails();
    const e = emails.find(m => m.id === emailId);
    if (e) { e.trashed = true; saveEmails(emails); }
  };

  const getUnreadCount = (userId) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return 0;
    return getAllEmails().filter(e => e.toEmail === user.email && !e.read && !e.trashed).length;
  };

  // ---- SEED ----
  const _seedWelcomeEmail = (user) => {
    sendEmail({
      fromId:    'system',
      fromName:  'MiniMail Team',
      fromEmail: 'hello@minimail.app',
      toEmail:   user.email,
      subject:   '👋 Welcome to MiniMail!',
      body:
`Hi ${user.name},

Welcome to MiniMail — your lightweight, clutter-free inbox.

Here's what you can do:
  • Compose and send emails to other MiniMail users
  • Star important messages
  • Search your inbox
  • Manage sent, starred, and trash folders

Get started by composing your first message!

– The MiniMail Team`,
    });
  };

  return {
    createUser, findUser,
    setSession, getSession, clearSession,
    sendEmail,
    getInbox, getSent, getStarred, getTrash,
    markRead, toggleStar, trashEmail,
    getUnreadCount,
    formatDate,
  };
})();
