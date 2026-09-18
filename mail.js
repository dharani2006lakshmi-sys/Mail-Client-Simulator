/**
 * mail.js — Email operations for MiniMail inbox
 */

let currentFolder = 'inbox';
let currentEmailId = null;
let currentUser = null;

function initMail() {
  currentUser = Storage.getSession();
  if (!currentUser) return;

  // Show user info
  document.getElementById('userChip').textContent = currentUser.email;

  renderEmails();
  updateBadge();
}

// ---- Folder ----
function setFolder(folder, el) {
  currentFolder = folder;
  currentEmailId = null;
  closeDetail();

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  const titles = { inbox: 'Inbox', sent: 'Sent', starred: 'Starred', trash: 'Trash' };
  document.getElementById('folderTitle').textContent = titles[folder] || folder;

  renderEmails();
}

// ---- Render list ----
function renderEmails() {
  const list    = document.getElementById('emailList');
  const query   = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let emails    = getEmailsForFolder();

  if (query) {
    emails = emails.filter(e =>
      e.subject.toLowerCase().includes(query) ||
      e.fromEmail.toLowerCase().includes(query) ||
      e.fromName.toLowerCase().includes(query) ||
      e.body.toLowerCase().includes(query)
    );
  }

  if (!emails.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>${query ? 'No results found.' : 'Nothing here yet.'}</p>
      </div>`;
    return;
  }

  list.innerHTML = emails.map(e => emailRow(e)).join('');
}

function getEmailsForFolder() {
  const id = currentUser.id;
  switch (currentFolder) {
    case 'inbox':   return Storage.getInbox(id);
    case 'sent':    return Storage.getSent(id);
    case 'starred': return Storage.getStarred(id);
    case 'trash':   return Storage.getTrash(id);
    default:        return [];
  }
}

function emailRow(e) {
  const isInbox  = currentFolder === 'inbox';
  const isSent   = currentFolder === 'sent';
  const initial  = (e.fromName || e.fromEmail || '?')[0].toUpperCase();
  const showName = isSent ? `To: ${e.toEmail}` : (e.fromName || e.fromEmail);
  const unread   = isInbox && !e.read ? 'unread' : '';
  const starred  = e.starred ? 'active' : '';

  return `
    <div class="email-item ${unread}" onclick="openEmail('${e.id}')">
      <div class="email-avatar">${initial}</div>
      <div class="email-info">
        <div class="email-from">${esc(showName)}</div>
        <div class="email-subject">${esc(e.subject)}</div>
        <div class="email-preview">${esc(e.body.slice(0, 80))}</div>
      </div>
      <div class="email-meta">
        <span class="email-time">${e.dateFormatted}</span>
        <span class="star-icon ${starred}"
              onclick="event.stopPropagation(); starEmail('${e.id}')">⭐</span>
      </div>
    </div>`;
}

// ---- Open email ----
function openEmail(id) {
  currentEmailId = id;
  Storage.markRead(id);
  updateBadge();
  renderEmails();

  const emails = getEmailsForFolder();
  const e = emails.find(m => m.id === id);
  if (!e) return;

  const panel = document.getElementById('detailPanel');
  const body  = document.getElementById('detailBody');
  const initial = (e.fromName || e.fromEmail || '?')[0].toUpperCase();

  body.innerHTML = `
    <div class="detail-subject">${esc(e.subject)}</div>
    <div class="detail-from">
      <div class="detail-avatar">${initial}</div>
      <div class="detail-sender-info">
        <strong>${esc(e.fromName || e.fromEmail)}</strong>
        <small>${esc(e.fromEmail)} → ${esc(e.toEmail)}</small>
        <small>${new Date(e.date).toLocaleString()}</small>
      </div>
    </div>
    <hr class="detail-divider"/>
    <div class="detail-content">${esc(e.body)}</div>`;

  const starBtn = document.getElementById('starBtn');
  starBtn.style.color = e.starred ? '#f5c842' : '';

  panel.classList.remove('hidden');
}

function closeDetail() {
  document.getElementById('detailPanel').classList.add('hidden');
  currentEmailId = null;
}

// ---- Actions ----
function toggleStar() {
  if (!currentEmailId) return;
  Storage.toggleStar(currentEmailId);
  const emails = getEmailsForFolder();
  const e = emails.find(m => m.id === currentEmailId);
  document.getElementById('starBtn').style.color =
    (e && e.starred) ? '#f5c842' : '';
  renderEmails();
}

function starEmail(id) {
  Storage.toggleStar(id);
  renderEmails();
}

function deleteEmail() {
  if (!currentEmailId) return;
  Storage.trashEmail(currentEmailId);
  closeDetail();
  renderEmails();
  updateBadge();
}

function replyEmail() {
  if (!currentEmailId) return;
  const emails = getEmailsForFolder();
  const e = emails.find(m => m.id === currentEmailId);
  if (!e) return;

  document.getElementById('composeTo').value      = e.fromEmail;
  document.getElementById('composeSubject').value = `Re: ${e.subject}`;
  document.getElementById('composeBody').value    = `\n\n--- Original message ---\n${e.body}`;
  openCompose();
}

// ---- Compose ----
function openCompose() {
  document.getElementById('composeOverlay').classList.remove('hidden');
  document.getElementById('composeTo').focus();
}

function closeCompose() {
  document.getElementById('composeOverlay').classList.add('hidden');
  document.getElementById('composeTo').value    = '';
  document.getElementById('composeSubject').value = '';
  document.getElementById('composeBody').value  = '';
  document.getElementById('composeError').classList.add('hidden');
}

function sendEmail() {
  const to      = document.getElementById('composeTo').value.trim();
  const subject = document.getElementById('composeSubject').value.trim();
  const body    = document.getElementById('composeBody').value.trim();
  const errEl   = document.getElementById('composeError');
  errEl.classList.add('hidden');

  if (!to) {
    errEl.textContent = 'Please enter a recipient.';
    errEl.classList.remove('hidden');
    return;
  }
  if (!isValidEmail(to)) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.classList.remove('hidden');
    return;
  }

  Storage.sendEmail({
    fromId:    currentUser.id,
    fromName:  currentUser.name,
    fromEmail: currentUser.email,
    toEmail:   to,
    subject:   subject || '(no subject)',
    body,
  });

  closeCompose();
  setFolder('sent', document.querySelector('[data-folder="sent"]'));
}

// ---- Badge ----
function updateBadge() {
  const count = Storage.getUnreadCount(currentUser.id);
  const badge = document.getElementById('inboxBadge');
  badge.textContent = count > 0 ? count : '';
}

// ---- Utils ----
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
