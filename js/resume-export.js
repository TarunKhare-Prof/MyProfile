// js/resume-export.js — DOM-scrape + jsPDF.html(), no html2pdf bundle
(function () {
  const A4_WIDTH_PX = 794; // ~96dpi width

  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const hasText = (s) => s && s.replace(/\s+/g,'').length > 0;

  async function waitForTabsReady(timeoutMs = 6000) {
    const t0 = performance.now();
    while (performance.now() - t0 < timeoutMs) {
      const hasAny =
        $$('#summary p').length ||
        $$('#experience p, #experience strong, #experience li').length ||
        $$('#projects-holder .project-card').length ||
        $$('#skills table.skills-table').length;
      if (hasAny) return true;
      await new Promise(r => setTimeout(r, 120));
    }
    return false;
  }

  // ---- extract content from already-rendered tabs ----
  function extractSummary() {
    return $$('#summary p').map(p => p.textContent.trim()).filter(hasText);
  }
  function extractExperience() {
    const parts = [];
    $$('#experience p').forEach(p => {
      if (hasText(p.textContent)) parts.push(`<p>${p.innerHTML.trim()}</p>`);
    });
    if (!parts.length) {
      const raw = ($('#experience')?.innerText || '').split('\n')
        .map(s => s.trim()).filter(hasText);
      raw.forEach(s => parts.push(`<p>${s}</p>`));
    }
    return parts;
  }
  function extractProjects() {
    return $$('#projects-holder .project-card').map(card => {
      const title = (card.querySelector('strong')?.textContent || '').trim();
      const desc  = (card.querySelector('p')?.textContent || '').trim();
      const langs = $$('.language-tag', card).map(x => x.textContent.trim());
      return { title, desc, langs };
    });
  }
  function extractSkills() {
    const byCat = {};
    $$('#skills .category-row').forEach(catRow => {
      const cat = catRow.textContent.trim();
      if (!cat) return;
      byCat[cat] = [];
      let r = catRow.nextElementSibling;
      while (r && !r.classList.contains('category-row')) {
        const tds = r.querySelectorAll('td');
        if (tds.length >= 2) {
          const name = tds[1].textContent.trim();
          if (hasText(name)) byCat[cat].push(name);
        }
        r = r.nextElementSibling;
      }
    });
    return byCat;
  }
  function extractEducation() {
    const lis = $$('#education li');
    if (lis.length) return lis.map(li => li.textContent.trim()).filter(hasText);
    return $$('#education p').map(p => p.textContent.trim()).filter(hasText);
  }
  function extractContact() {
    const lis = $$('#contact li');
    if (lis.length) return lis.map(li => li.textContent.trim()).filter(hasText);
    return $$('#contact p').map(p => p.textContent.trim()).filter(hasText);
  }

  // ---- build the offscreen resume DOM ----
  function buildResumeDOMFromTabs() {
    const root = document.getElementById('resumeRoot');
    root.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      `width:${A4_WIDTH_PX}px`,
      'padding:32px 40px',
      'font-family:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif',
      'line-height:1.4',
      'color:#111',
      'background:#fff'
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;gap:16px;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:10px';
    header.innerHTML = `
      <img src="images/profile.jpg" alt="Profile" style="width:72px;height:72px;border-radius:50%;object-fit:cover">
      <div>
        <h1 style="margin:0;font-size:22px">Tarun Khare</h1>
        <div style="color:#374151;font-size:13px;margin-top:2px">Sr. Software Engineer · Bengaluru, India</div>
        <div style="font-size:12px;color:#374151">Portfolio: https://tarunkhare.in · LinkedIn: linkedin.com/in/tarun-khare-98ab5085</div>
        <div style="font-size:12px;color:#374151">Email: tarun@tarunkhare.in · Phone: +91-8770057790</div>
      </div>`;
    wrap.appendChild(header);

    const makeSec = (title) => {
      const d = document.createElement('div');
      d.className = 'resume-section';
      d.style.marginTop = '14px';
      d.innerHTML = `<h2 style="font-size:16px;margin:0 0 6px;color:#111827">${title}</h2>`;
      return d;
    };

    const summary = extractSummary();
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

    const exp = extractExperience();
    if (exp.length) {
      const e = makeSec('Work Experience');
      e.innerHTML += exp.join('');
      wrap.appendChild(e);
    }

    const projects = extractProjects();
    if (projects.length) {
      const pr = makeSec('Professional Projects');
      projects.forEach(p => {
        const div = document.createElement('div');
        div.style.margin = '8px 0';
        div.innerHTML = `<div style="font-weight:600;font-size:13.5px">${p.title || ''}</div>
                         ${hasText(p.desc) ? `<p style="margin:4px 0;font-size:12.5px;color:#374151">${p.desc}</p>` : ''}`;
        if (p.langs && p.langs.length) {
          const tags = document.createElement('div');
          tags.style.cssText = 'margin-top:4px;display:flex;flex-wrap:wrap;gap:4px';
          p.langs.forEach(l => {
            const chip = document.createElement('span');
            chip.textContent = l;
            chip.style.cssText = 'font-size:11.5px;padding:2px 6px;background:#eef2ff;color:#4338ca;border-radius:999px';
            tags.appendChild(chip);
          });
          div.appendChild(tags);
        }
        pr.appendChild(div);
      });
      wrap.appendChild(pr);
    }

    const skillsByCat = extractSkills();
    const cats = Object.keys(skillsByCat);
    if (cats.length) {
      const sk = makeSec('Skills');
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px';
      cats.forEach(cat => {
        const col = document.createElement('div');
        col.innerHTML = `<div style="font-size:12px;color:#374151;font-weight:700;margin-bottom:4px">${cat}</div>`;
        const tags = document.createElement('div');
        tags.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px';
        skillsByCat[cat].forEach(name => {
          const chip = document.createElement('span');
          chip.textContent = name;
          chip.style.cssText = 'font-size:11.5px;padding:2px 6px;background:#eef2ff;color:#4338ca;border-radius:999px';
          tags.appendChild(chip);
        });
        col.appendChild(tags);
        grid.appendChild(col);
      });
      sk.appendChild(grid);
      wrap.appendChild(sk);
    }

    const edu = extractEducation();
    if (edu.length) {
      const ed = makeSec('Education');
      ed.innerHTML += edu.map(s => `<p style="margin:4px 0;font-size:12.5px">${s}</p>`).join('');
      wrap.appendChild(ed);
    }

    const contact = extractContact();
    if (contact.length) {
      const ct = makeSec('Contact');
      ct.innerHTML += contact.map(s => `<p style="margin:4px 0;font-size:12.5px">${s}</p>`).join('');
      wrap.appendChild(ct);
    }

    root.appendChild(wrap);
    return root;
  }

  async function ensureFontsReady() {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }
    await new Promise(r => requestAnimationFrame(r));
  }

  async function exportPDF_with_jsPDF(rootEl) {
    await ensureFontsReady();
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF failed to load. Check CDN tag.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    // Show the resume for capture
    const prev = {
      visibility: rootEl.style.visibility,
      zIndex: rootEl.style.zIndex
    };
    rootEl.style.visibility = 'visible';
    rootEl.style.zIndex = '2147483647';

    try {
      await doc.html(rootEl, {
        margin: [36, 36, 40, 36], // pt
        autoPaging: 'text',
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        callback: (d) => d.save('Tarun_Khare_Resume.pdf')
      });
    } finally {
      // hide again
      rootEl.style.visibility = prev.visibility || 'hidden';
      rootEl.style.zIndex = prev.zIndex || '';
    }
  }

  // Bind the button
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('downloadResume');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        const ready = await waitForTabsReady();
        if (!ready) {
          alert('Content not loaded yet. Try again in a moment.');
          return;
        }
        const rootEl = buildResumeDOMFromTabs();
        const h = rootEl.offsetHeight;
        if (!h || h < 20) {
          alert('Resume appears empty after build.'); return;
        }
        await exportPDF_with_jsPDF(rootEl);
      } catch (e) {
        console.error(e);
        alert('Could not generate PDF. See console for details.');
      }
    });
  });
})();
