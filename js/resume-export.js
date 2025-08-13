// js/resume-export.js  — DOM-scraping version
(function () {
  const A4_WIDTH_PX = 794; // ~96dpi width

  // --- tiny helpers ---
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const hasText = (s) => s && s.replace(/\s+/g,'').length > 0;

  // Wait until your tabs finished rendering (projects & summary exist)
  async function waitForTabsReady(timeoutMs = 5000) {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      const summaryHas = $$('#summary p').length > 0;
      const expHas     = $$('#experience p, #experience li, #experience strong').length > 0;
      const projHas    = $$('#projects-holder .project-card').length > 0;
      const skillsHas  = $$('#skills table.skills-table').length > 0;
      if (summaryHas || expHas || projHas || skillsHas) return true;
      await new Promise(r => setTimeout(r, 120));
    }
    return false;
  }

  // ============= EXTRACT FROM DOM =============
  function extractSummary() {
    const sec = $('#summary'); if (!sec) return [];
    return $$('#summary p').map(p => p.textContent.trim()).filter(hasText);
  }

  function extractExperience() {
    const sec = $('#experience'); if (!sec) return [];
    // Keep lightweight HTML so bold lines stay bold
    const blocks = [];
    $$('#experience p, #experience strong, #experience ul, #experience li').forEach(n => {
      // capture paragraphs as HTML
      if (n.tagName === 'P') {
        const html = n.innerHTML.trim();
        if (hasText(n.textContent)) blocks.push(`<p>${html}</p>`);
      }
    });
    // If it was built as HTML strings wrapped in <p>, above will still work fine
    if (!blocks.length) {
      const raw = sec.innerText.split('\n').map(s => s.trim()).filter(hasText);
      raw.forEach(s => blocks.push(`<p>${s}</p>`));
    }
    return blocks;
  }

  function extractProjects() {
    const cards = $$('#projects-holder .project-card');
    if (!cards.length) return [];
    return cards.map(card => {
      const titleStrong = card.querySelector('strong');
      let title = titleStrong ? titleStrong.textContent.trim() : '';
      let desc  = '';
      // p after strong
      const p = card.querySelector('p');
      if (p) desc = p.textContent.trim();
      const langs = $$('.language-tag', card).map(x => x.textContent.trim());
      return { title, desc, langs };
    });
  }

  function extractSkills() {
    const table = $('#skills table.skills-table');
    if (!table) return {};
    const byCat = {};
    let currentCat = 'Skills';
    $$('#skills .category-row').forEach(catRow => {
      const txt = catRow.textContent.trim();
      if (hasText(txt)) currentCat = txt;
      byCat[currentCat] = byCat[currentCat] || [];
      // collect following non-category rows until next category-row
      let r = catRow.nextElementSibling;
      while (r && !r.classList.contains('category-row')) {
        const cells = r.querySelectorAll('td');
        if (cells.length >= 4) {
          const name = cells[1].textContent.trim();
          if (hasText(name)) byCat[currentCat].push(name);
        }
        r = r.nextElementSibling;
      }
    });
    return byCat;
  }

  function extractEducation() {
    const sec = $('#education'); if (!sec) return [];
    // get text of lis if present, else fall back to plain text from p’s
    const lis = $$('#education li');
    if (lis.length) return lis.map(li => li.textContent.trim()).filter(hasText);
    return $$('#education p').map(p => p.textContent.trim()).filter(hasText);
  }

  function extractContact() {
    const sec = $('#contact'); if (!sec) return [];
    const lis = $$('#contact li');
    if (lis.length) return lis.map(li => li.textContent.trim()).filter(hasText);
    return $$('#contact p').map(p => p.textContent.trim()).filter(hasText);
  }

  // ============= BUILD RESUME DOM =============
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

    // Summary
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
      s.appendChild(ul); wrap.appendChild(s);
    }

    // Work Experience
    const expBlocks = extractExperience();
    if (expBlocks.length) {
      const e = makeSec('Work Experience');
      e.innerHTML += expBlocks.join('');
      wrap.appendChild(e);
    }

    // Professional Projects
    const projects = extractProjects();
    if (projects.length) {
      const pr = makeSec('Professional Projects');
      projects.forEach(p => {
        const div = document.createElement('div');
        div.style.margin = '8px 0';
        const title = p.title || '';
        const desc  = p.desc  || '';
        div.innerHTML = `<div style="font-weight:600;font-size:13.5px">${title}</div>
                         ${hasText(desc) ? `<p style="margin:4px 0;font-size:12.5px;color:#374151">${desc}</p>` : ''}`;
        if (p.langs && p.langs.length) {
          const tags = document.createElement('div');
          tags.style.cssText = 'margin-top:4px;display:flex;flex-wrap:wrap;gap:4px';
          p.langs.forEach(l => {
            const tag = document.createElement('span');
            tag.textContent = l;
            tag.style.cssText = 'font-size:11.5px;padding:2px 6px;background:#eef2ff;color:#4338ca;border-radius:999px';
            tags.appendChild(tag);
          });
          div.appendChild(tags);
        }
        pr.appendChild(div);
      });
      wrap.appendChild(pr);
    }

    // Skills
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

    // Education
    const edu = extractEducation();
    if (edu.length) {
      const ed = makeSec('Education');
      ed.innerHTML += edu.map(s => `<p style="margin:4px 0;font-size:12.5px">${s}</p>`).join('');
      wrap.appendChild(ed);
    }

    // Contact
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

  async function exportPDF(rootEl) {
    await ensureFontsReady();

    const opt = {
      margin:       [0.5, 0.5, 0.6, 0.5],
      filename:     'Tarun_Khare_Resume.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    // Make it fully visible for capture (no opacity!)
    const prev = { ...rootEl.style };
    Object.assign(rootEl.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: `${A4_WIDTH_PX}px`,
      opacity: '1',
      pointerEvents: 'none',
      zIndex: 2147483647 // on top; small flash is expected
    });

    try {
      await html2pdf().set(opt).from(rootEl).save();
    } finally {
      Object.assign(rootEl.style, prev); // restore
    }
  }

  // Wire button
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('downloadResume');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        const ready = await waitForTabsReady();
        if (!ready) {
          alert('Content not loaded yet. Try after the page finishes rendering.');
          return;
        }

        const rootEl = buildResumeDOMFromTabs();

        const h = rootEl.offsetHeight;
        if (!h || h < 10) {
          alert('Resume appears empty. Check that tabs rendered content.');
          return;
        }

        if (typeof html2pdf === 'undefined') {
          alert('html2pdf.js failed to load. Check the CDN tag in index.html.');
          return;
        }

        await exportPDF(rootEl);
      } catch (e) {
        console.error(e);
        alert('Could not generate the resume from the page content. See console for details.');
      }
    });
  });
})();
