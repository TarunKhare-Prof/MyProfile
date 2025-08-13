// js/resume-export.js

(function () {
  // Safe helpers (no dependence on your page's IIFE)
  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function buildResumeDOM(data, skillsData, personalData) {
    const root = document.getElementById('resumeRoot');
    root.innerHTML = '';

    // A4 width at 96dpi ≈ 794px; keep margins inside the PDF call
    const wrap = document.createElement('div');
    wrap.className = 'resume-doc';
    wrap.style.padding = '32px 40px';
    wrap.style.fontFamily = `"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif`;
    wrap.style.color = '#111';

    const profileImg = data.profileImage || 'images/profile.jpg';

    // Header
    const header = document.createElement('div');
    header.className = 'resume-header';
    header.style.display = 'flex';
    header.style.gap = '16px';
    header.style.alignItems = 'center';
    header.style.borderBottom = '2px solid #e5e7eb';
    header.style.paddingBottom = '12px';
    header.style.marginBottom = '10px';

    header.innerHTML = `
      <img src="${profileImg}" alt="Profile" style="width:72px;height:72px;border-radius:50%;object-fit:cover" crossorigin="anonymous">
      <div>
        <h1 style="margin:0;font-size:22px">Tarun Khare</h1>
        <div style="color:#374151;font-size:13px;margin-top:2px">Sr. Software Engineer · Bengaluru, India</div>
        <div style="font-size:12px;color:#374151">Portfolio: https://tarunkhare.in | LinkedIn: linkedin.com/in/tarun-khare-98ab5085</div>
        <div style="font-size:12px;color:#374151">Email: tarun@tarunkhare.in | Phone: +91-8770057790</div>
      </div>
    `;
    wrap.appendChild(header);

    // Section helper
    const sec = (title) => {
      const d = document.createElement('div');
      d.className = 'resume-sec';
      d.style.marginTop = '14px';
      d.innerHTML = `<h2 style="font-size:16px;margin:0 0 6px;color:#111827">${title}</h2>`;
      return d;
    };

    // Summary
    const summary = (data.tabs.find(t => t.id === 'summary') || {}).content || [];
    if (summary.length) {
      const s = sec('Profile Summary');
      const ul = document.createElement('ul');
      ul.style.margin = '0';
      ul.style.paddingLeft = '16px';
      ul.style.fontSize = '12.5px';
      summary.forEach(li => {
        const el = document.createElement('li');
        el.style.margin = '4px 0';
        el.textContent = li;
        ul.appendChild(el);
      });
      s.appendChild(ul);
      wrap.appendChild(s);
    }

    // Experience
    const exp = (data.tabs.find(t => t.id === 'experience') || {}).content || [];
    if (exp.length) {
      const e = sec('Work Experience');
      e.innerHTML += exp.map(p => `<p style="margin:4px 0;font-size:12.5px">${p}</p>`).join('');
      wrap.appendChild(e);
    }

    // Professional Projects with languages
    const projTab = data.tabs.find(t => t.id === 'projects');
    if (projTab && Array.isArray(projTab.content)) {
      const pr = sec('Professional Projects');
      projTab.content.forEach(item => {
        if (item && typeof item === 'object' && item.description) {
          const box = document.createElement('div');
          box.style.margin = '8px 0';
          const title = item.description.replace(/^<strong>|<\/strong>/g, '');
          const langs = Array.isArray(item.languages) ? item.languages : [];
          box.innerHTML = `<div style="font-weight:600;font-size:13.5px">${title}</div>`;
          if (langs.length) {
            const tags = document.createElement('div');
            tags.style.marginTop = '4px';
            tags.style.display = 'flex';
            tags.style.flexWrap = 'wrap';
            tags.style.gap = '4px';
            langs.forEach(l => {
              const tag = document.createElement('span');
              tag.textContent = l;
              tag.style.fontSize = '11.5px';
              tag.style.padding = '2px 6px';
              tag.style.background = '#eef2ff';
              tag.style.color = '#4338ca';
              tag.style.borderRadius = '999px';
              tags.appendChild(tag);
            });
            box.appendChild(tags);
          }
          pr.appendChild(box);
        }
      });
      wrap.appendChild(pr);
    }

    // Personal Projects (titles + about only)
    if (Array.isArray(personalData) && personalData.length) {
      const pp = sec('Personal Projects (Selected)');
      personalData.slice(0, 6).forEach(p => {
        const row = document.createElement('div');
        row.style.margin = '8px 0';
        const about = (p.description && p.description.about) ? p.description.about : '';
        row.innerHTML = `
          <div style="font-weight:600;font-size:13.5px">${p.title}</div>
          <p style="margin:4px 0;font-size:12.5px;color:#374151">${about}</p>
        `;
        pp.appendChild(row);
      });
      wrap.appendChild(pp);
    }

    // Skills
    if (Array.isArray(skillsData)) {
      const sk = sec('Skills');
      const byCat = skillsData.reduce((a, s) => {
        (a[s.category] = a[s.category] || []).push(s); return a;
      }, {});
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr 1fr';
      grid.style.gap = '10px';
      Object.entries(byCat).forEach(([cat, list]) => {
        const col = document.createElement('div');
        col.innerHTML = `<div style="font-size:12px;color:#374151;font-weight:700;margin-bottom:4px">${cat}</div>`;
        const tags = document.createElement('div');
        tags.style.display = 'flex';
        tags.style.flexWrap = 'wrap';
        tags.style.gap = '4px';
        list.forEach(x => {
          const tag = document.createElement('span');
          tag.textContent = x.name;
          tag.style.fontSize = '11.5px';
          tag.style.padding = '2px 6px';
          tag.style.background = '#eef2ff';
          tag.style.color = '#4338ca';
          tag.style.borderRadius = '999px';
          tags.appendChild(tag);
        });
        col.appendChild(tags);
        grid.appendChild(col);
      });
      sk.appendChild(grid);
      wrap.appendChild(sk);
    }

    // Education
    const edu = (data.tabs.find(t => t.id === 'education') || {}).content || [];
    if (edu.length) {
      const ed = sec('Education');
      ed.innerHTML += edu.map(p => `<p style="margin:4px 0;font-size:12.5px">${p}</p>`).join('');
      wrap.appendChild(ed);
    }

    // Contact
    const contact = (data.tabs.find(t => t.id === 'contact') || {}).content || [];
    if (contact.length) {
      const ct = sec('Contact');
      ct.innerHTML += contact.map(p => `<p style="margin:4px 0;font-size:12.5px">${p}</p>`).join('');
      wrap.appendChild(ct);
    }

    root.appendChild(wrap);
    return root;
  }

  async function exportPDF(rootEl) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error('jsPDF not loaded.');
      alert('PDF library failed to load. Check your internet or CDN.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    await doc.html(rootEl, {
      callback: (d) => d.save('Tarun_Khare_Resume.pdf'),
      margin: [36, 36, 40, 36], // top, left, bottom, right
      autoPaging: 'text',
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' }
    });
  }

  // Hook the button
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('downloadResume');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        // Load fresh each time, so PDF always reflects the latest content
        const [portfolio, skills] = await Promise.all([
          loadJSON('data/portfolio.json'),
          loadJSON('data/skills.json')
        ]);
        let personal = [];
        try { personal = await loadJSON('data/personal_projects.json'); } catch (e) { /* optional */ }

        const rootEl = buildResumeDOM(portfolio, skills, personal);
        await exportPDF(rootEl);
      } catch (err) {
        console.error(err);
        alert('Could not generate resume. See console for details.');
      }
    });
  });
})();
