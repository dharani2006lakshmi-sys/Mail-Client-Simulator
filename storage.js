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
    const cleanEmail = String(email || '').trim().toLowerCase();
    const users = getUsers();
    if (users.find(u => u.email === cleanEmail)) {
      return { error: 'An account with this email already exists.' };
    }
    const user = { id: uuid(), name: name || cleanEmail.split('@')[0], email: cleanEmail, password: password || '' };
    users.push(user);
    saveUsers(users);
    _seedWelcomeEmail(user);
    return { user };
  };

  const ensureDemoUser = (email, password, name) => {
    const cleanEmail = String(email || 'guest@minimail.com').trim().toLowerCase();
    const users = getUsers();
    let user = users.find(u => u.email === cleanEmail);
    if (!user) {
      return createUser(name || cleanEmail.split('@')[0], cleanEmail, password || '').user;
    }
    return user;
  };

  const findUser = (email, password) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const users = getUsers();
    const user = users.find(u => u.email === cleanEmail && u.password === password);
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

  const sendEmail = ({ fromId, fromName, fromEmail, toEmail, subject, body, draft = false }) => {
    const users = getUsers();
    const cleanTo = String(toEmail || '').trim().toLowerCase();
    const recipient = users.find(u => u.email === cleanTo);

    const email = {
      id:        uuid(),
      fromId,
      fromName,
      fromEmail,
      toEmail:   cleanTo,
      subject:   subject || '(no subject)',
      body:      body || '',
      date:      now(),
      read:      draft,
      starred:   false,
      trashed:   false,
      draft:     !!draft,
    };

    const emails = getAllEmails();
    emails.push(email);
    saveEmails(emails);

    return { success: true, delivered: !!recipient, email };
  };

  const getInbox = (userId) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return [];
    return getAllEmails()
      .filter(e => e.toEmail === user.email && !e.trashed && !e.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const getSent = (userId) => {
    return getAllEmails()
      .filter(e => e.fromId === userId && !e.trashed && !e.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const getDrafts = (userId) => {
    return getAllEmails()
      .filter(e => e.fromId === userId && e.draft && !e.trashed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(e => ({ ...e, dateFormatted: formatDate(e.date) }));
  };

  const getStarred = (userId) => {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return [];
    return getAllEmails()
      .filter(e => e.starred && !e.trashed && !e.draft &&
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

  const markRead = (emailId, readState = true) => {
    const emails = getAllEmails();
    const e = emails.find(m => m.id === emailId);
    if (e) { e.read = readState; saveEmails(emails); }
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
    return getAllEmails().filter(e => e.toEmail === user.email && !e.read && !e.trashed && !e.draft).length;
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
  • Manage sent, drafts, starred, and trash folders

Get started by composing your first message!

– The MiniMail Team`,
    });
    sendEmail({
      fromId:    'system_tips',
      fromName:  'Product Updates',
      fromEmail: 'updates@minimail.app',
      toEmail:   user.email,
      subject:   'Quick Tips: Shortcuts & Compose Tools',
      body: `Hi ${user.name},\n\nClick any email to read, reply, star, or move it to Trash. Use the Search bar at the top or Settings (gear icon) to switch Dark/Light mode and Accent colors.`,
    });
    sendEmail({
      fromId:    'system_security',
      fromName:  'Security Alert',
      fromEmail: 'security@minimail.app',
      toEmail:   user.email,
      subject:   'Demo Session Active',
      body: `Hi ${user.name},\n\nYour MiniMail demo workspace is active and synced locally in your browser's LocalStorage.`,
    });
    sendEmail({
      fromId:    user.id,
      fromName:  user.name,
      fromEmail: user.email,
      toEmail:   'team@minimail.app',
      subject:   'Project Standup Notes (Draft)',
      body:      'Agenda for today:\n1. Inbox UI review\n2. Demo login verification',
      draft:     true,
    });
  };

  return {
    createUser, findUser, ensureDemoUser, getUsers,
    setSession, getSession, clearSession,
    sendEmail,
    getInbox, getSent, getDrafts, getStarred, getTrash,
    markRead, toggleStar, trashEmail,
    getUnreadCount,
    formatDate,
  };
})();
