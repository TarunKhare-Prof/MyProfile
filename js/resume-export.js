// js/resume-export.js  (Hosted mode: fetch JSON and export PDF)
(function () {
  // Build URLs relative to the current page (works on GitHub Pages / repo subpaths)
  const base = new URL('.', location.href);
  const URLS = {
    portfolio: new URL('data/portfolio.json', base).href,
    skills: new URL('data/skills.json', base).href,
    personal: new URL('data/personal_projects.json', base).href, // optional
  };

  async function loadJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  }

  async function getAllData() {
    const [portfolio, skills] = await Promise.all([
      loadJSON(URLS.portfolio),
      loadJSON(URLS.skills),
    ]);
    let personal = [];
    try { personal = await loadJSON(URLS.personal); } catch (_) {}
    return { portfolio, skills, personal };
  }

  function buildResumeDOM(portfolio, skills, personal) {
    const root = document.getElementById('resumeRoot');
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'padding:32px 40px',
      'font-family:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif',
      'line-height:1.4',
      'color:#111',
      'background:#fff',
      'width:794px' // A4 width at 96dpi
    ].join(';');

    const profileImg = portfolio.profileImage || 'images/profile.jpg';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;gap:16px;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:10px';
    header.innerHTML = `
      <img src="${profileImg}" alt="Profile" style="width:72px;height:72px;border-radius:50%;object-fit:cover" crossorigin="anonymous">
      <div>
        <h1 style="margin:0;font-size:22px">Tarun Khare</h1>
        <div style="color:#374151;font-size:13px;margin-top:2px">Sr. Software Engineer · Bengaluru, India</div>
        <div style="font-size:12px;color:#374151">Portfolio: https://tarunkhare.in | LinkedIn: linkedin.com/in/tarun-khare-98ab5085</div>
        <div style="font-size:12px;color:#374151">Email: tarun@tarunkhare.in | Phone: +91-8770057790</div>
      </div>`;
    wrap.appendChild(header);

    const makeSec = (title) => {
      const d = document.createElement('div');
      d.style.marginTop = '14px';
      d.innerHTML = `<h2 style="font-size:16px;margin:0 0 6px;color:#111827">${title}</h2>`;
      return d;
    };

    // Summary
    const summary = (portfolio.tabs?.find(t => t.id === 'summary') || {}).content || [];
    if (summary.length) {
      const s = makeSec('Profile Summary');
      const ul = document.createElement('ul');
      ul.style.cssText = 'margin:0;padding-left:16px;font-size:12.5px';
      summary.forEach(txt => {
        const li = document.createElement('li');
        li.style.margin = '4px 0';
        li.textContent = txt;
        ul.appendChild(li);
      });
      s.appendChild(ul);
      wrap.appendChild(s);
    }

    // Experience
    const exp = (portfolio.tabs?.find(t => t.id === 'experience') || {}).content || [];
    if (exp.length) {
      const e = makeSec('Work Experience');
      e.innerHTML += exp.map(p => `<p style="margin:4px 0;font-size:12.5px">${p}</p>`).join('');
      wrap.appendChild(e);
    }

    // Projects (with language/IDE tags)
    const projTab = portfolio.tabs?.find(t => t.id === 'projects');
    if (projTab && Array.isArray(projTab.content)) {
      const pr = makeSec('Professional Projects');
      projTab.content.forEach(item => {
        if (item && typeof item === 'object' && item.description) {
          const div = document.createElement('div');
          div.style.margin = '8px 0';
          const title = item.description.replace(/^<strong>|<\/strong>/g, '');
          div.innerHTML = `<div style="font-weight:600;font-size:13.5px">${title}</div>`;
          const langs = Array.isArray(item.languages) ? item.languages : [];
          if (langs.length) {
            const tags = document.createElement('div');
            tags.style.cssText = 'margin-top:4px;display:flex;flex-wrap:wrap;gap:4px';
            langs.forEach(l => {
              const tag = document.createElement('span');
              tag.textContent = l;
              tag.style.cssText = 'font-size:11.5px;padding:2px 6px;background:#eef2ff;color:#4338ca;border-radius:999px';
              tags.appendChild(tag);
            });
            div.appendChild(tags);
          }
          pr.appendChild(div);
        }
      });
      wrap.appendChild(pr);
    }

    // Personal projects (compact)
    if (Array.isArray(personal) && personal.length) {
      const pp = makeSec('Personal Projects (Selected)');
      personal.slice(0, 6).forEach(p => {
        const row = document.createElement('div');
        row.style.margin = '8px 0';
        const about = (p.description && p.description.about) ? p.description.about : '';
        row.innerHTML = `<div style="font-weight:600;font-size:13.5px">${p.title}</div>
                         <p style="margin:4px 0;font-size:12.5px;color:#374151">${about}</p>`;
        pp.appendChild(row);
      });
      wrap.appendChild(pp);
    }

    // Skills
    if (Array.isArray(skills)) {
      const sk = makeSec('Skills');
      const byCat = skills.reduce((a, s) => { (a[s.category] = a[s.category] || []).push(s); return a; }, {});
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px';
      Object.entries(byCat).forEach(([cat, list]) => {
        const col = document.createElement('div');
        col.innerHTML = `<div style="font-size:12px;color:#374151;font-weight:700;margin-bottom:4px">${cat}</div>`;
        const tags = document.createElement('div');
        tags.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px';
        list.forEach(x => {
          const tag = document.createElement('span');
          tag.textContent = x.name;
          tag.style.cssText = 'font-size:11.5px;padding:2px 6px;background:#eef2ff;color:#4338ca;border-radius:999px';
          tags.appendChild(tag);
        });
        col.appendChild(tags);
        grid.appendChild(col);
      });
      sk.appendChild(grid);
      wrap.appendChild(sk);
    }

    // Education
    const edu = (portfolio.tabs?.find(t => t.id === 'education') || {}).content || [];
    if (edu.length) {
      const ed = makeSec('Education');
      ed.innerHTML += edu.map(p => `<p style="margin:4px 0;font-size:12.5px">${p}</p>`).join('');
      wrap.appendChild(ed);
    }

    // Contact
    const contact = (portfolio.tabs?.find(t => t.id === 'contact') || {}).content || [];
    if (contact.length) {
      const ct = makeSec('Contact');
      ct.innerHTML += contact.map(p => `<p style="margin:4px 0;font-size:12.5px">${p}</p>`).join('');
      wrap.appendChild(ct);
    }

    root.appendChild(wrap);
    return root;
  }

  async function exportPDF(rootEl) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library failed to load. Check your internet/CDN.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    await doc.html(rootEl, {
      callback: (d) => d.save('Tarun_Khare_Resume.pdf'),
      margin: [36, 36, 40, 36],
      autoPaging: 'text',
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('downloadResume');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        const { portfolio, skills, personal } = await getAllData();
        if (!portfolio?.tabs?.length) {
          alert('portfolio.json is missing or malformed.');
          return;
        }
        const rootEl = buildResumeDOM(portfolio, skills || [], personal || []);
        await exportPDF(rootEl);
      } catch (e) {
        console.error(e);
        alert('Could not generate the resume. See console for details.');
      }
    });
  });
})();
