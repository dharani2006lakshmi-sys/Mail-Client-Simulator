/**
 * mail.js — Email operations & SPA handlers for MiniMail
 */

let currentFolder = 'inbox';
let currentEmailId = null;
let currentUser = null;
let searchQuery = '';

function initMail() {
  let session = Storage.getSession();
  if (!session) return;
  if (!session.id) {
    session = Storage.ensureDemoUser(session.email, '', session.name);
    Storage.setSession(session);
  }
  currentUser = session;

  const avatar = document.getElementById('avatar-letter');
  if (avatar) avatar.textContent = (currentUser.email || currentUser.name || 'U').charAt(0).toUpperCase();

  closeDetail();
  renderEmails();
  updateBadges();
}

function showFolder(folder) {
  currentFolder = folder;
  currentEmailId = null;
  closeDetail();

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.folder === folder);
  });

  const titles = { inbox: 'Inbox', starred: 'Starred', sent: 'Sent', drafts: 'Drafts', trash: 'Trash' };
  const titleEl = document.getElementById('folder-title');
  if (titleEl) titleEl.textContent = titles[folder] || folder;

  const selectAll = document.getElementById('select-all');
  if (selectAll) selectAll.checked = false;

  renderEmails();
}

function getEmailsForFolder() {
  if (!currentUser) return [];
  const id = currentUser.id;
  switch (currentFolder) {
    case 'inbox':   return Storage.getInbox(id);
    case 'sent':    return Storage.getSent(id);
    case 'starred': return Storage.getStarred(id);
    case 'drafts':  return Storage.getDrafts(id);
    case 'trash':   return Storage.getTrash(id);
    default:        return [];
  }
}

function renderEmails() {
  const listEl = document.getElementById('email-list');
  const countEl = document.getElementById('email-count');
  if (!listEl) return;

  let emails = getEmailsForFolder();
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    emails = emails.filter(e =>
      (e.subject || '').toLowerCase().includes(q) ||
      (e.fromEmail || '').toLowerCase().includes(q) ||
      (e.fromName || '').toLowerCase().includes(q) ||
      (e.toEmail || '').toLowerCase().includes(q) ||
      (e.body || '').toLowerCase().includes(q)
    );
  }

  if (countEl) {
    countEl.textContent = emails.length ? `1-${emails.length} of ${emails.length}` : '0 of 0';
  }

  if (!emails.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>${searchQuery ? 'No results found.' : 'Nothing here yet.'}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = emails.map(emailRow).join('');
}

function emailRow(e) {
  const isInbox = currentFolder === 'inbox';
  const isSentOrDraft = currentFolder === 'sent' || currentFolder === 'drafts';
  const displayFrom = isSentOrDraft ? `To: ${e.toEmail || '(no recipient)'}` : (e.fromName || e.fromEmail);
  const initial = (displayFrom || '?')[0].toUpperCase();
  const unread = isInbox && !e.read ? 'unread' : '';
  const starred = e.starred ? 'active' : '';

  return `
    <div class="email-item ${unread}" onclick="openEmail('${e.id}')">
      <input type="checkbox" class="email-check" data-id="${e.id}" onclick="event.stopPropagation()" />
      <div class="email-avatar">${initial}</div>
      <div class="email-info">
        <div class="email-from">${esc(displayFrom)}</div>
        <div class="email-subject">${esc(e.subject)}</div>
        <div class="email-preview">${esc((e.body || '').slice(0, 80))}</div>
      </div>
      <div class="email-meta">
        <span class="email-time">${e.dateFormatted || ''}</span>
        <span class="star-icon ${starred}" onclick="event.stopPropagation(); starEmail('${e.id}')">★</span>
      </div>
    </div>`;
}

function openEmail(id) {
  const emails = getEmailsForFolder();
  const e = emails.find(m => m.id === id);
  if (!e) return;

  currentEmailId = id;
  Storage.markRead(id, true);
  updateBadges();
  renderEmails();

  document.getElementById('email-list-view').classList.add('hidden');
  document.getElementById('email-detail-view').classList.remove('hidden');

  document.getElementById('detail-subject').textContent = e.subject || '(no subject)';
  const initial = (e.fromName || e.fromEmail || '?')[0].toUpperCase();
  document.getElementById('detail-avatar').textContent = initial;
  document.getElementById('detail-from').textContent = `${e.fromName || e.fromEmail} <${e.fromEmail}> -> ${e.toEmail}`;
  document.getElementById('detail-date').textContent = new Date(e.date).toLocaleString();
  document.getElementById('detail-content').textContent = e.body || '';

  const starBtn = document.getElementById('detail-star-btn');
  if (starBtn) {
    starBtn.innerHTML = `<span class="material-icons">${e.starred ? 'star' : 'star_border'}</span>`;
    starBtn.style.color = e.starred ? '#f5c842' : '';
  }
}

function closeDetail() {
  currentEmailId = null;
  const listView = document.getElementById('email-list-view');
  const detailView = document.getElementById('email-detail-view');
  if (listView) listView.classList.remove('hidden');
  if (detailView) detailView.classList.add('hidden');
}

function starEmail(id) {
  Storage.toggleStar(id);
  renderEmails();
}

function starCurrentEmail() {
  if (!currentEmailId) return;
  const starred = Storage.toggleStar(currentEmailId);
  const starBtn = document.getElementById('detail-star-btn');
  if (starBtn) {
    starBtn.innerHTML = `<span class="material-icons">${starred ? 'star' : 'star_border'}</span>`;
    starBtn.style.color = starred ? '#f5c842' : '';
  }
  renderEmails();
}

function deleteCurrentEmail() {
  if (!currentEmailId) return;
  Storage.trashEmail(currentEmailId);
  closeDetail();
  renderEmails();
  updateBadges();
  showToast('Moved to Trash');
}

function markCurrentUnread() {
  if (!currentEmailId) return;
  Storage.markRead(currentEmailId, false);
  closeDetail();
  renderEmails();
  updateBadges();
  showToast('Marked as unread');
}

function sendReply() {
  if (!currentEmailId || !currentUser) return;
  const replyEl = document.getElementById('reply-input');
  const text = replyEl ? replyEl.value.trim() : '';
  if (!text) return showToast('Write a reply first');

  const e = getEmailsForFolder().find(m => m.id === currentEmailId);
  if (!e) return;

  Storage.sendEmail({
    fromId: currentUser.id,
    fromName: currentUser.name,
    fromEmail: currentUser.email,
    toEmail: e.fromEmail,
    subject: e.subject.startsWith('Re:') ? e.subject : `Re: ${e.subject}`,
    body: text
  });
  if (replyEl) replyEl.value = '';
  updateBadges();
  showToast('Reply sent');
}

function searchMail(val) {
  searchQuery = val.trim();
  renderEmails();
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  searchQuery = '';
  renderEmails();
}

function refreshInbox() {
  renderEmails();
  updateBadges();
  showToast('Inbox refreshed');
}

function toggleSelectAll(cb) {
  document.querySelectorAll('.email-check').forEach(el => { el.checked = !!cb.checked; });
}

function deleteSelected() {
  const checked = [...document.querySelectorAll('.email-check:checked')];
  if (!checked.length) return showToast('Select at least one message');
  checked.forEach(c => Storage.trashEmail(c.dataset.id));
  renderEmails();
  updateBadges();
  showToast(`Moved ${checked.length} message(s) to Trash`);
}

function markSelectedRead() {
  const checked = [...document.querySelectorAll('.email-check:checked')];
  if (!checked.length) return showToast('Select at least one message');
  checked.forEach(c => Storage.markRead(c.dataset.id, true));
  renderEmails();
  updateBadges();
  showToast(`Marked ${checked.length} message(s) as read`);
}

function openCompose() {
  const modal = document.getElementById('compose-modal');
  if (modal) modal.classList.remove('hidden');
  const to = document.getElementById('compose-to');
  if (to) to.focus();
}

function closeCompose() {
  const modal = document.getElementById('compose-modal');
  if (modal) modal.classList.add('hidden');
  ['compose-to', 'compose-cc', 'compose-subject', 'compose-body'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function minimizeCompose() {
  const modal = document.getElementById('compose-modal');
  if (modal) modal.classList.add('hidden');
}

function sendEmail() {
  if (!currentUser) return;
  const to = document.getElementById('compose-to').value.trim();
  const subject = document.getElementById('compose-subject').value.trim();
  const body = document.getElementById('compose-body').value.trim();

  if (!to || !isValidEmail(to)) {
    return showToast('Enter a valid recipient email');
  }

  Storage.sendEmail({
    fromId: currentUser.id,
    fromName: currentUser.name,
    fromEmail: currentUser.email,
    toEmail: to,
    subject: subject || '(no subject)',
    body
  });

  closeCompose();
  showFolder('sent');
  updateBadges();
  showToast('Email sent');
}

function saveDraft() {
  if (!currentUser) return;
  const to = document.getElementById('compose-to').value.trim();
  const subject = document.getElementById('compose-subject').value.trim();
  const body = document.getElementById('compose-body').value.trim();

  Storage.sendEmail({
    fromId: currentUser.id,
    fromName: currentUser.name,
    fromEmail: currentUser.email,
    toEmail: to,
    subject: subject || '(Draft)',
    body,
    draft: true
  });

  closeCompose();
  updateBadges();
  showToast('Saved to Drafts');
}

function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  if (panel) panel.classList.toggle('hidden');
}

function toggleDarkMode(cb) {
  document.body.classList.toggle('light-mode', !cb.checked);
}

function toggleCompact(cb) {
  document.body.classList.toggle('compact', !!cb.checked);
}

function setTheme(color) {
  document.documentElement.style.setProperty('--accent', color);
}

function updateBadges() {
  if (!currentUser) return;
  const inboxBadge = document.getElementById('inbox-badge');
  const draftBadge = document.getElementById('draft-badge');
  const unread = Storage.getUnreadCount(currentUser.id);
  const drafts = Storage.getDrafts(currentUser.id).length;
  if (inboxBadge) inboxBadge.textContent = unread > 0 ? unread : '';
  if (draftBadge) draftBadge.textContent = drafts > 0 ? drafts : '';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
