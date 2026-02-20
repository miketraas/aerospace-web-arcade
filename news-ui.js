const statusEl = document.getElementById('status');
const civilEl = document.getElementById('civil');
const defenseEl = document.getElementById('defense');
const sourcesEl = document.getElementById('sources');
const windowSel = document.getElementById('window');
const refreshBtn = document.getElementById('refresh');

function renderSection(section){
  if (!section?.items?.length) return `<div class="small">No items returned.</div>`;
  return `
    <div class="small">${section.summary}</div>
    <ul class="list">
      ${section.items.map(i => `
        <li>
          <a href="${i.url}" target="_blank" rel="noopener">${i.title}</a>
          <span class="small">— ${i.publisher}${i.date ? ` — ${new Date(i.date).toLocaleDateString()}` : ""}</span>
          ${i.keyPoints?.length ? `<ul class="list">${i.keyPoints.map(k=>`<li class="small">${k}</li>`).join("")}</ul>` : ""}
        </li>
      `).join("")}
    </ul>
  `;
}

async function load(){
  const days = windowSel.value;
  statusEl.textContent = "GENERATING…";
  civilEl.textContent = "Loading…";
  defenseEl.textContent = "Loading…";
  sourcesEl.textContent = "Loading…";

  const res = await fetch(`/.netlify/functions/newsBriefing?days=${encodeURIComponent(days)}`);
  if (!res.ok){
    statusEl.textContent = "FAILED";
    civilEl.textContent = "Backend error.";
    defenseEl.textContent = "Backend error.";
    sourcesEl.textContent = "Backend error.";
    return;
  }

  const data = await res.json();
  statusEl.textContent = "LIVE";

  civilEl.innerHTML = renderSection(data.civil);
  defenseEl.innerHTML = renderSection(data.defense);

  sourcesEl.innerHTML = `
    <div class="small">Feeds (discovery sources):</div>
    <ul class="list">
      ${data.feedSources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.section.toUpperCase()}: ${s.name}</a></li>`).join("")}
    </ul>
    <div class="small">Article citations are the linked headlines above.</div>
  `;
}

refreshBtn.addEventListener('click', load);
load();