/**
 * Markdown for Mac — Renderer Process
 *
 * @author  Albert Garcia Diaz
 * @created 2026-03-20
 * @description Frontend logic: file display, TOC generation, file tree,
 *              drag & drop, zoom, find bar, and menu event handling.
 */
'use strict';

// ─── State ───────────────────────────────────────────────────────────────────

let currentFilePath = null;
let sidebarVisible = true;
let zoom = 1.0;
let activeTab = 'toc';
let findVisible = false;

// ─── DOM References ──────────────────────────────────────────────────────────

const app        = document.getElementById('app');
const sidebar    = document.getElementById('sidebar');
const welcome    = document.getElementById('welcome');
const scrollWrap = document.getElementById('scroll-wrapper');
const content    = document.getElementById('content');
const tocList    = document.getElementById('toc-list');
const tocEmpty   = document.getElementById('toc-empty');
const fileTree   = document.getElementById('file-tree');
const filesEmpty = document.getElementById('files-empty');
const titleName  = document.getElementById('title-file-name');
const zoomLevel  = document.getElementById('zoom-level');
const findBar    = document.getElementById('find-bar');
const findInput  = document.getElementById('find-input');
const findCount  = document.getElementById('find-count');
const recentList = document.getElementById('recent-list');
const recentSec  = document.getElementById('recent-section');

// ─── File Display ────────────────────────────────────────────────────────────

function displayFile({ path: filePath, name, html, toc }) {
  currentFilePath = filePath;
  titleName.textContent = name;

  welcome.style.display = 'none';
  scrollWrap.style.display = 'block';

  content.innerHTML = html;
  scrollWrap.scrollTop = 0;

  buildTOC(toc);
  addCopyButtons();
  patchLinks(filePath);
}

function patchLinks(filePath) {
  const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));

  content.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#')) {
      // Anchor link – scroll to heading
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById(decodeURIComponent(href.slice(1)));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (href.startsWith('http://') || href.startsWith('https://') || a.classList.contains('external-link')) {
      a.addEventListener('click', e => {
        e.preventDefault();
        window.api.openExternal(a.dataset.href || href);
      });
    } else if (/\.(md|markdown|mdown|mkd)$/i.test(href)) {
      a.addEventListener('click', async e => {
        e.preventDefault();
        const resolved = fileDir + '/' + href;
        const result = await window.api.readFile(resolved);
        if (result && !result.error) displayFile(result);
      });
    }
  });
}

// ─── Table of Contents ───────────────────────────────────────────────────────

function buildTOC(toc) {
  tocList.innerHTML = '';

  if (!toc || toc.length === 0) {
    tocList.style.display = 'none';
    tocEmpty.style.display = 'flex';
    tocEmpty.querySelector('p').textContent = 'No headings found in this document.';
    return;
  }

  tocList.style.display = 'block';
  tocEmpty.style.display = 'none';

  const minLevel = Math.min(...toc.map(h => h.level));

  toc.forEach(item => {
    const el = document.createElement('div');
    el.className = `toc-item toc-level-${item.level}`;
    el.style.paddingLeft = ((item.level - minLevel) * 12) + 'px';
    el.textContent = item.text;
    el.title = item.text;

    el.addEventListener('click', () => {
      const target = document.getElementById(item.id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      document.querySelectorAll('.toc-item.active').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
    });

    tocList.appendChild(el);
  });

  // Highlight active TOC item on scroll
  setupScrollSpy(toc);
}

function setupScrollSpy(toc) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.toc-item.active').forEach(i => i.classList.remove('active'));
          const tocEl = [...tocList.querySelectorAll('.toc-item')].find(el => {
            const item = toc.find(h => h.id === id);
            return item && el.textContent === item.text;
          });
          if (tocEl) {
            tocEl.classList.add('active');
            tocEl.scrollIntoView({ block: 'nearest' });
          }
        }
      });
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  );

  toc.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) observer.observe(el);
  });
}

// ─── File Tree ───────────────────────────────────────────────────────────────

function buildFileTree(files, container = fileTree, depth = 0) {
  if (depth === 0) container.innerHTML = '';

  if (!files || files.length === 0) {
    if (depth === 0) {
      filesEmpty.style.display = 'flex';
    }
    return;
  }

  if (depth === 0) filesEmpty.style.display = 'none';

  files.forEach(file => {
    const item = document.createElement('div');
    item.className = `file-item file-${file.type}`;
    item.style.paddingLeft = (8 + depth * 14) + 'px';

    const icon = document.createElement('span');
    icon.className = 'file-icon';

    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;

    item.appendChild(icon);
    item.appendChild(name);

    if (file.type === 'file') {
      icon.textContent = '';
      item.title = file.path;
      item.addEventListener('click', async () => {
        document.querySelectorAll('.file-item.active').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const result = await window.api.readFile(file.path);
        if (result && !result.error) displayFile(result);
      });
      container.appendChild(item);
    } else {
      // Directory
      icon.textContent = '▶';
      icon.className = 'file-icon dir-arrow';
      let expanded = false;

      const children = document.createElement('div');
      children.className = 'file-children hidden';
      buildFileTree(file.children, children, depth + 1);

      item.addEventListener('click', e => {
        e.stopPropagation();
        expanded = !expanded;
        icon.textContent = expanded ? '▼' : '▶';
        children.classList.toggle('hidden', !expanded);
      });

      container.appendChild(item);
      container.appendChild(children);
    }
  });
}

// ─── Copy Buttons ────────────────────────────────────────────────────────────

function addCopyButtons() {
  content.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText(code?.textContent || '').then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    pre.appendChild(btn);
  });
}

// ─── Sidebar Tabs ────────────────────────────────────────────────────────────

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.sidebar-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('toc-panel').classList.toggle('hidden', tab !== 'toc');
  document.getElementById('files-panel').classList.toggle('hidden', tab !== 'files');
}

document.querySelectorAll('.sidebar-tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ─── Sidebar Toggle ──────────────────────────────────────────────────────────

function toggleSidebar() {
  sidebarVisible = !sidebarVisible;
  sidebar.classList.toggle('collapsed', !sidebarVisible);
  document.getElementById('sidebar-toggle').classList.toggle('active', !sidebarVisible);
}

document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

// ─── Zoom ────────────────────────────────────────────────────────────────────

function setZoom(newZoom) {
  zoom = Math.max(0.6, Math.min(2.5, Math.round(newZoom * 10) / 10));
  content.style.fontSize = (zoom * 16) + 'px';
  zoomLevel.textContent = Math.round(zoom * 100) + '%';
}

document.getElementById('zoom-in').addEventListener('click', () => setZoom(zoom + 0.1));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoom - 0.1));

// ─── Find Bar ────────────────────────────────────────────────────────────────

function showFind() {
  findVisible = true;
  findBar.classList.add('visible');
  findInput.focus();
  findInput.select();
}

function hideFind() {
  findVisible = false;
  findBar.classList.remove('visible');
  findInput.value = '';
  findCount.textContent = '';
  window.api.stopFind();
}

function doFind(forward = true) {
  const q = findInput.value.trim();
  if (!q) { window.api.stopFind(); findCount.textContent = ''; return; }
  window.api.findInPage(q, forward);
}

findInput.addEventListener('input', () => doFind(true));
findInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideFind();
  else if (e.key === 'Enter') doFind(!e.shiftKey);
});

document.getElementById('find-prev').addEventListener('click', () => doFind(false));
document.getElementById('find-next-btn').addEventListener('click', () => doFind(true));
document.getElementById('find-close').addEventListener('click', hideFind);

// ─── Drag & Drop ─────────────────────────────────────────────────────────────

document.addEventListener('dragover', e => {
  e.preventDefault();
  app.classList.add('drag-over');
});

document.addEventListener('dragleave', e => {
  if (!e.relatedTarget) app.classList.remove('drag-over');
});

document.addEventListener('drop', async e => {
  e.preventDefault();
  app.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files);
  const mdFile = files.find(f => /\.(md|markdown|mdown|mkd)$/i.test(f.name));
  if (mdFile) {
    const result = await window.api.readFile(mdFile.path);
    if (result && !result.error) displayFile(result);
  }
});

// ─── Welcome Screen ──────────────────────────────────────────────────────────

async function openFile() {
  const result = await window.api.openFile();
  if (result && !result.error) displayFile(result);
}

async function openFolder() {
  const result = await window.api.openFolder();
  if (result) {
    buildFileTree(result.files);
    switchTab('files');
  }
}

document.getElementById('welcome-open-btn').addEventListener('click', openFile);
document.getElementById('welcome-folder-btn').addEventListener('click', openFolder);

async function loadRecentFiles() {
  const recent = await window.api.getRecentFiles();

  if (!recent || recent.length === 0) {
    recentSec.style.display = 'none';
    return;
  }

  recentSec.style.display = 'block';
  recentList.innerHTML = '';

  recent.slice(0, 8).forEach(filePath => {
    const li = document.createElement('li');
    const parts = filePath.split('/');
    const fileName = parts.pop();
    const dirPath = parts.join('/');

    li.innerHTML = `
      <span class="recent-icon">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 1.5A1.5 1.5 0 013.5 0h5l3 3v7.5A1.5 1.5 0 0110 12H3.5A1.5 1.5 0 012 10.5v-9z" opacity="0.15"/>
          <path d="M8.5 0v2.5a.5.5 0 00.5.5H11.5" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
      </span>
      <span class="recent-name">${fileName}</span>
      <span class="recent-dir">${dirPath}</span>
    `;
    li.title = filePath;
    li.addEventListener('click', async () => {
      const result = await window.api.readFile(filePath);
      if (result && !result.error) displayFile(result);
    });
    recentList.appendChild(li);
  });
}

loadRecentFiles();

// ─── Menu Event Listeners ────────────────────────────────────────────────────

window.api.onMenuOpenFile(() => openFile());
window.api.onMenuOpenFolder(() => openFolder());
window.api.onMenuFind(() => showFind());
window.api.onToggleSidebar(() => toggleSidebar());
window.api.onZoomIn(() => setZoom(zoom + 0.1));
window.api.onZoomOut(() => setZoom(zoom - 0.1));
window.api.onZoomReset(() => setZoom(1.0));
window.api.onFileOpened((_event, data) => displayFile(data));

window.api.onMenuExportPDF(async () => {
  const result = await window.api.exportPDF();
  if (result && result.error) {
    console.error('PDF export error:', result.error);
  }
});

// ─── Keyboard Shortcuts (renderer-side) ──────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === '0') {
    e.preventDefault();
    setZoom(1.0);
  }
});
