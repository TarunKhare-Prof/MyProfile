// js/resume-export.js — tidy PDF with left-aligned text & page-break control
(function () {
  const PX_A4_WIDTH = 794;           // ~96dpi
  const FILE_NAME   = "Tarun_Khare_Resume.pdf";

  // ---------- data ----------
  async function loadJSON(path) {
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return r.json();
  }
  async function getAllData() {
    const base = new URL(".", location.href);
    const portfolio = await loadJSON(new URL("data/portfolio.json", base));
    const skills    = await loadJSON(new URL("data/skills.json", base));
    let personal = [];
    try { personal = await loadJSON(new URL("data/personal_projects.json", base)); } catch {}
    return { portfolio, skills, personal };
  }

  // ---------- helpers ----------
  const el = (tag, attrs = {}, html = "") => {
    const n = document.createElement(tag);
    if (attrs.style) n.style.cssText = attrs.style;
    Object.entries(attrs).forEach(([k, v]) => { if (k !== "style") n.setAttribute(k, v); });
    if (html) n.innerHTML = html;
    return n;
  };
  const stripHTML = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  };

  function parseExperience(arr) {
    const out = [];
    let cur = null;
    (arr || []).forEach(line => {
      const t = (line || "").trim();
      if (!t) return;
      if (t.startsWith("<strong")) {
        if (cur) out.push(cur);
        cur = { title: stripHTML(t), bullets: [] };
      } else {
        const bullet = t.replace(/^•\s*/, "").trim();
        if (bullet) cur ? cur.bullets.push(bullet) : out.push({ title: bullet, bullets: [] });
      }
    });
    if (cur) out.push(cur);
    return out;
  }

  function parseProjects(list) {
    return (list || []).map(item => {
      if (typeof item === "string") return { title: stripHTML(item), desc: "", tags: [] };
      if (item && typeof item === "object") {
        const tmp = document.createElement("div");
        tmp.innerHTML = item.description || "";
        const strong = tmp.querySelector("strong");
        const title = strong ? strong.textContent.replace(/\s*–\s*$/, "").trim() : stripHTML(item.description);
        if (strong) strong.remove();
        const desc = tmp.textContent.trim();
        return { title, desc, tags: Array.isArray(item.languages) ? item.languages : [] };
      }
      return { title: String(item || ""), desc: "", tags: [] };
    });
  }
  const parseListHTML = (htmlPieces) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = (htmlPieces || []).join("");
    return [...tmp.querySelectorAll("li")].map(li => li.textContent.trim()).filter(Boolean);
  };

  // ---------- builder ----------
  function buildResumeDOM({ portfolio, skills /*, personal*/ }) {
    const root = document.getElementById("resumeRoot");
    root.innerHTML = "";

    // Styles are scoped to the resume to override your site’s justify styles.
    const css = `
      .resume{ width:${PX_A4_WIDTH}px; padding:30px 34px;
        box-sizing:border-box; background:#fff; color:#111;
        font-family: Arial, Helvetica, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
        line-height:1.35; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
      }
      /* IMPORTANT: kill justification & odd spacing from site CSS */
      .resume, .resume *{ text-align:left !important; letter-spacing:0 !important; word-spacing:0 !important;
        white-space:normal !important; }
      .hdr{ display:flex; gap:18px; align-items:flex-start; justify-content:space-between;
        border-bottom:2px solid #e5e7eb; padding-bottom:10px; margin-bottom:12px; }
      .hdr h1{ font-size:22px; margin:0 0 4px; }
      .muted{ color:#374151; }
      .hdr .right{ text-align:right; font-size:12px; line-height:1.4; }
      .section{ margin-top:14px; break-inside:avoid; }
      .section h2{ font-size:15px; margin:0 0 6px; color:#111827; letter-spacing:.2px; }
      .bullets{ margin:0; padding-left:18px; list-style:disc outside; font-size:12.6px; }
      .bullets li{ margin:4px 0; }
      .role{ margin:8px 0 10px; break-inside:avoid; }
      .role-title{ font-weight:700; font-size:13.5px; margin-bottom:4px; }
      .proj{ margin:8px 0; break-inside:avoid; }
      .proj-title{ font-weight:700; font-size:13.5px; }
      .proj-desc{ margin:3px 0 0; font-size:12.6px; color:#374151; }
      .tags{ margin-top:6px; display:flex; flex-wrap:wrap; gap:4px; }
      .tag{ font-size:11.5px; padding:2px 6px; background:#eef2ff; color:#4338ca; border-radius:999px; }
      .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .pill-list{ display:flex; flex-wrap:wrap; gap:6px; }
      .pill{ font-size:11.5px; padding:2px 6px; background:#f3f4f6; border-radius:999px; }
      .small{ font-size:11.5px; color:#4b5563; margin-top:8px; }
      .page-break{ height:0; break-after:page; }
    `;

    const wrap = el("div", { class: "resume" });
    wrap.appendChild(el("style", {}, css));

    // header
    const hdr = el("div", { class: "hdr" });
    const left = el("div", {}, `
      <h1>Tarun Khare</h1>
      <div class="muted" style="font-size:13px;">Sr. Software Engineer · Bengaluru, India</div>
    `);
    const right = el("div", { class: "right" }, `
      <div>Portfolio: https://tarunkhare.in</div>
      <div>LinkedIn: linkedin.com/in/tarun-khare-98ab5085</div>
      <div>Email: tarun@tarunkhare.in</div>
      <div>Phone: +91-8770057790</div>
    `);
    hdr.append(left, right);
    wrap.appendChild(hdr);

    // summary
    const summary = portfolio.tabs.find(t => t.id === "summary")?.content || [];
    if (summary.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Profile Summary"));
      const ul = el("ul", { class: "bullets" });
      summary.forEach(s => ul.appendChild(el("li", {}, s)));
      sec.appendChild(ul);
      wrap.appendChild(sec);
    }

    // experience
    const exp = portfolio.tabs.find(t => t.id === "experience")?.content || [];
    if (exp.length) {
      const roles = parseExperience(exp);
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Work Experience"));
      roles.forEach(r => {
        const role = el("div", { class: "role" });
        role.appendChild(el("div", { class: "role-title" }, r.title));
        if (r.bullets?.length) {
          const ul = el("ul", { class: "bullets" });
          r.bullets.forEach(b => ul.appendChild(el("li", {}, b)));
          role.appendChild(ul);
        }
        sec.appendChild(role);
      });
      wrap.appendChild(sec);
    }

    // page break keeps the first page tidy
    wrap.appendChild(el("div", { class: "page-break" }));

    // projects
    const projects = parseProjects(portfolio.tabs.find(t => t.id === "projects")?.content || []);
    if (projects.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Professional Projects"));
      projects.forEach(p => {
        const row = el("div", { class: "proj" });
        row.appendChild(el("div", { class: "proj-title" }, p.title));
        if (p.desc) row.appendChild(el("div", { class: "proj-desc" }, p.desc));
        if (p.tags?.length) {
          const tags = el("div", { class: "tags" });
          p.tags.forEach(t => tags.appendChild(el("span", { class: "tag" }, t)));
          row.appendChild(tags);
        }
        sec.appendChild(row);
      });
      wrap.appendChild(sec);
    }

    // skills
    if (Array.isArray(skills) && skills.length) {
      const byCat = skills.reduce((a, s) => ((a[s.category] = a[s.category] || []).push(s), a), {});
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Skills"));
      const grid = el("div", { class: "grid-2" });
      Object.entries(byCat).forEach(([cat, list]) => {
        const col = el("div");
        col.appendChild(el("div", { style: "font-weight:700; font-size:12.6px; margin-bottom:6px;" }, cat));
        const pills = el("div", { class: "pill-list" });
        list.forEach(s => pills.appendChild(el("span", { class: "pill" }, s.name)));
        col.appendChild(pills);
        grid.appendChild(col);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    }

    // education
    const eduItems = parseListHTML(portfolio.tabs.find(t => t.id === "education")?.content || []);
    if (eduItems.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Education"));
      const ul = el("ul", { class: "bullets" });
      eduItems.forEach(x => ul.appendChild(el("li", {}, x)));
      sec.appendChild(ul);
      wrap.appendChild(sec);
    }

    // contact
    const contactItems = parseListHTML(portfolio.tabs.find(t => t.id === "contact")?.content || []);
    if (contactItems.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Contact"));
      const ul = el("ul", { class: "bullets" });
      contactItems.forEach(x => ul.appendChild(el("li", {}, x)));
      sec.appendChild(ul);
      wrap.appendChild(sec);
    }

    wrap.appendChild(el("div", { class: "small" }, `Generated ${new Date().toLocaleString()}`));

    root.appendChild(wrap);
    return root;
  }

  // ---------- export ----------
  async function exportPDF(rootEl) {
    if (typeof html2pdf === "undefined") throw new Error("html2pdf not loaded");
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
    await new Promise(r => requestAnimationFrame(r));

    const opt = {
      margin: 18,                                // pt
      filename: FILE_NAME,
      pagebreak: { mode: ["css", "legacy"] },    // respect .page-break / avoid
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
    };
    await html2pdf().set(opt).from(rootEl).save();
  }

  // ---------- wire ----------
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("downloadResume");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      try {
        const data = await getAllData();
        const rootEl = buildResumeDOM(data);

        // ensure it participates in layout for measurement
        Object.assign(rootEl.style, { opacity: "0", left: "0", top: "0", width: PX_A4_WIDTH + "px" });
        const h = rootEl.offsetHeight;
        if (!h || h < 30) {
          console.error("Empty resume height", h);
          alert("Resume looks empty. Check JSON fetch in the console.");
          return;
        }
        await exportPDF(rootEl);
      } catch (e) {
        console.error(e);
        alert("Could not generate the PDF. See console for details.");
      }
    });
  });
})();
