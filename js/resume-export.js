// js/resume-export.js  — tidy, multi-section PDF from your JSON on a static site
(function () {
  // ---- constants
  const PX_A4_WIDTH = 794; // ~96dpi
  const FILE_NAME = "Tarun_Khare_Resume.pdf";

  // ---- data util
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

  // ---- helpers
  const el = (tag, attrs = {}, html = "") => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => (n.style && k === "style" ? (n.style.cssText = v) : n.setAttribute(k, v)));
    if (html) n.innerHTML = html;
    return n;
  };

  function stripHTML(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  // Parse your experience array into roles with bullet points
  function parseExperience(expArray) {
    const out = [];
    let current = null;
    (expArray || []).forEach(line => {
      const t = (line || "").trim();
      if (!t) return;
      if (t.startsWith("<strong")) {
        if (current) out.push(current);
        current = { title: stripHTML(t), bullets: [] };
      } else {
        // turn leading "• " into bullet text
        const bullet = t.replace(/^•\s*/, "").trim();
        if (bullet) current ? current.bullets.push(bullet) : out.push({ title: bullet, bullets: [] });
      }
    });
    if (current) out.push(current);
    return out;
  }

  // Projects: extract <strong>Title –</strong> and keep remaining (optional)
  function parseProjects(list) {
    return (list || []).map(item => {
      if (typeof item === "string") {
        const text = stripHTML(item);
        return { title: text, desc: "", tags: [] };
      }
      if (item && typeof item === "object") {
        const tmp = document.createElement("div");
        tmp.innerHTML = item.description || "";
        const strong = tmp.querySelector("strong");
        const title = strong ? strong.textContent.replace(/\s*–\s*$/, "").trim() : stripHTML(item.description || "");
        if (strong) strong.remove();
        const desc = tmp.textContent.trim();
        const tags = Array.isArray(item.languages) ? item.languages : [];
        return { title, desc, tags };
      }
      return { title: String(item || ""), desc: "", tags: [] };
    });
  }

  // Education + contact are HTML strings with <li> — read items nicely
  function parseListHTML(htmlPieces) {
    const tmp = document.createElement("div");
    tmp.innerHTML = (htmlPieces || []).join("");
    const items = [...tmp.querySelectorAll("li")].map(li => li.textContent.trim()).filter(Boolean);
    return items;
  }

  // ---- main DOM builder
  function buildResumeDOM({ portfolio, skills, personal }) {
    const root = document.getElementById("resumeRoot");
    root.innerHTML = "";

    // local style just for the PDF (keeps your site’s CSS untouched)
    const css = `
      .resume{ width:${PX_A4_WIDTH}px; padding:28px 36px; font-family:'Segoe UI',system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif; color:#111; line-height:1.35; }
      .hdr{ display:flex; gap:20px; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #e5e7eb; padding-bottom:10px; margin-bottom:12px;}
      .hdr .left h1{ font-size:22px; margin:0 0 4px; }
      .muted{ color:#374151; }
      .hdr .right{ text-align:right; font-size:12px; line-height:1.4; }
      .section{ margin-top:14px; break-inside:avoid; }
      .section h2{ font-size:15px; margin:0 0 8px; color:#111827; letter-spacing:.2px; }
      .bullets{ margin:0; padding-left:18px; font-size:12.5px; }
      .bullets li{ margin:4px 0; }
      .role{ margin:8px 0 10px; }
      .role-title{ font-weight:600; font-size:13.5px; margin-bottom:4px; }
      .proj{ margin:8px 0; }
      .proj-title{ font-weight:600; font-size:13.5px; }
      .proj-desc{ margin:3px 0 0; font-size:12.5px; color:#374151; }
      .tags{ margin-top:6px; display:flex; flex-wrap:wrap; gap:4px; }
      .tag{ font-size:11.5px; padding:2px 6px; background:#eef2ff; color:#4338ca; border-radius:999px; }
      .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
      .pill-list{ display:flex; flex-wrap:wrap; gap:6px; }
      .pill{ font-size:11.5px; padding:2px 6px; background:#f3f4f6; border-radius:999px; }
      .small{ font-size:11.5px; color:#4b5563; margin-top:8px; }
      /* page breaks for html2pdf */
      .html2pdf__page-break{ height:0; break-after:page; }
    `;

    const wrap = el("div", { class: "resume" });
    wrap.appendChild(el("style", {}, css));

    // header
    const profileImg = portfolio.profileImage || "images/profile.jpg";
    const hdr = el("div", { class: "hdr" });
    const left = el("div", { class: "left" }, `
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
    const summaryTab = portfolio.tabs.find(t => t.id === "summary");
    if (summaryTab?.content?.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Profile Summary"));
      const ul = el("ul", { class: "bullets" });
      summaryTab.content.filter(Boolean).forEach(t => ul.appendChild(el("li", {}, t)));
      sec.appendChild(ul);
      wrap.appendChild(sec);
    }

    // experience
    const expTab = portfolio.tabs.find(t => t.id === "experience");
    if (expTab?.content?.length) {
      const roles = parseExperience(expTab.content);
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

    // page break after Experience (keeps page 1 tidy)
    wrap.appendChild(el("div", { class: "html2pdf__page-break" }));

    // projects
    const projTab = portfolio.tabs.find(t => t.id === "projects");
    if (projTab?.content?.length) {
      const parsed = parseProjects(projTab.content);
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Professional Projects"));
      parsed.forEach(p => {
        const item = el("div", { class: "proj" });
        item.appendChild(el("div", { class: "proj-title" }, p.title));
        if (p.desc) item.appendChild(el("div", { class: "proj-desc" }, p.desc));
        if (p.tags?.length) {
          const tags = el("div", { class: "tags" });
          p.tags.forEach(t => tags.appendChild(el("span", { class: "tag" }, t)));
          item.appendChild(tags);
        }
        sec.appendChild(item);
      });
      wrap.appendChild(sec);
    }

    // skills (2 columns of tag chips by category)
    if (Array.isArray(skills) && skills.length) {
      const byCat = skills.reduce((a, s) => ((a[s.category] = a[s.category] || []).push(s), a), {});
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Skills"));
      const grid = el("div", { class: "grid-2" });
      Object.entries(byCat).forEach(([cat, list]) => {
        const col = el("div");
        col.appendChild(el("div", { style: "font-weight:700; font-size:12.5px; margin-bottom:6px;" }, cat));
        const pills = el("div", { class: "pill-list" });
        list.forEach(s => pills.appendChild(el("span", { class: "pill" }, s.name)));
        col.appendChild(pills);
        grid.appendChild(col);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    }

    // education
    const eduTab = portfolio.tabs.find(t => t.id === "education");
    const eduItems = eduTab ? parseListHTML(eduTab.content) : [];
    if (eduItems.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Education"));
      const ul = el("ul", { class: "bullets" });
      eduItems.forEach(x => ul.appendChild(el("li", {}, x)));
      sec.appendChild(ul);
      wrap.appendChild(sec);
    }

    // contact (clean text)
    const contactTab = portfolio.tabs.find(t => t.id === "contact");
    const contactItems = contactTab ? parseListHTML(contactTab.content) : [];
    if (contactItems.length) {
      const sec = el("div", { class: "section" });
      sec.appendChild(el("h2", {}, "Contact"));
      const ul = el("ul", { class: "bullets" });
      contactItems.forEach(x => ul.appendChild(el("li", {}, x)));
      sec.appendChild(ul);
      wrap.appendChild(sec);
    }

    // footer line
    wrap.appendChild(el("div", { class: "small" }, `Generated ${new Date().toLocaleString()}`));

    // mount
    root.appendChild(wrap);
    return root;
  }

  // ---- export with html2pdf (better pagination)
  async function exportPDF(rootEl) {
    if (typeof html2pdf === "undefined") throw new Error("html2pdf bundle not loaded");
    // one frame to settle layout/fonts
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
    await new Promise(r => requestAnimationFrame(r));

    const opt = {
      margin: 14, // pt
      filename: FILE_NAME,
      pagebreak: { mode: ["css", "legacy"] },
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
    };
    await html2pdf().set(opt).from(rootEl).save();
  }

  // ---- wire button
  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("downloadResume");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      try {
        const data = await getAllData();
        const rootEl = buildResumeDOM(data);

        // make sure the generator has real height before exporting
        rootEl.style.opacity = "0";
        rootEl.style.left = "0";
        rootEl.style.top = "0";
        rootEl.style.width = PX_A4_WIDTH + "px";

        const h = rootEl.offsetHeight;
        if (!h || h < 30) {
          console.error("Resume root measured empty height:", h);
          alert("Resume content looks empty. Check console/network for JSON errors.");
          return;
        }
        await exportPDF(rootEl);
      } catch (e) {
        console.error(e);
        alert("Could not generate the PDF. Open DevTools → Console/Network for details.");
      }
    });
  });
})();
