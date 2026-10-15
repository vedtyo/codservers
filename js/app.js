const state = {
  servers: [],
  selectedClient: "All",
  selectedGame: "ALL",
  search: "",
  sort: "players",
  page: 1,
  favorites: new Set(JSON.parse(localStorage.getItem("favoriteServers") || "[]")),
  lastFetch: Date.now()
};

const els = {
  status: document.getElementById("status"),
  heroPlayers: document.getElementById("heroPlayers"),
  heroServers: document.getElementById("heroServers"),
  clientTabs: document.getElementById("clientTabs"),
  subGamePills: document.getElementById("subGamePills"),
  servers: document.getElementById("servers"),
  serverCountLabel: document.getElementById("serverCountLabel"),
  lastUpdated: document.getElementById("lastUpdated"),
  topSearchBtn: document.getElementById("topSearchBtn"),
  topSearchBar: document.getElementById("topSearchBar"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchButton"),
  refreshBtn: document.getElementById("refreshBtn"),
  darkBtn: document.getElementById("darkButton"),
  topFavBtn: document.getElementById("topFavBtn"),
  favBadge: document.getElementById("favBadge"),
  toast: document.getElementById("toast")
};

function saveFavorites() {
  localStorage.setItem("favoriteServers", JSON.stringify([...state.favorites]));
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function updateStatus() {
  if (!els.status) return;
  els.status.textContent = "Updated " + formatTime();
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function getClientForGame(gameId) {
  if (!gameId) return { name: "Unknown", color: "#9ca3af" };
  const id = String(gameId).toUpperCase();
  for (const [clientKey, clientData] of Object.entries(CLIENT_CONFIG)) {
    if (clientData.games.includes(id)) return { key: clientKey, ...clientData };
  }
  return { name: "Unknown", color: "#9ca3af" };
}

function safeText(value, fallback = "") {
  return value == null ? fallback : String(value);
}

function getGameLabel(gameId) {
  return gameId && gameId !== "ALL" ? gameId : "All clients";
}

function normalizeGameId(raw) {
  const value = String(raw || "").toUpperCase();

  if (value.includes("T6ZM") || value.includes("BO2ZM") || value.includes("ZOMBIE")) return "T6ZM";
  if (value.includes("T6") || value.includes("BO2")) return "T6";
  if (value.includes("T5ZM") || value.includes("BO1ZM") || value.includes("ZOMBIE")) return "T5ZM";
  if (value.includes("T5") || value.includes("BO1")) return "T5";
  if (value.includes("T4ZM") || value.includes("WAWZM")) return "T4ZM";
  if (value.includes("T4") || value.includes("WAW")) return "T4";
  if (value.includes("IW5") || value.includes("MW3")) return "IW5";
  if (value.includes("IW4") || value.includes("MW2")) return "IW4";
  if (value.includes("IW3") || value.includes("COD4")) return "IW3";
  if (value.includes("IW6") || value.includes("GHOSTS")) return "IW6";
  if (value.includes("T7") || value.includes("BO3")) return "T7";
  if (value.includes("H2M") || value.includes("MW2R")) return "H2M";
  if (value.includes("H1") || value.includes("MWR")) return "H1";
  if (value.includes("IW7") || value.includes("INFINITE")) return "IW7";
  if (value.includes("SHG1") || value.includes("AW")) return "SHG1";
  if (value.includes("S2") || value.includes("WWII")) return "S2";
  if (value.includes("CODUO")) return "CODUO";
  if (value.includes("COD2")) return "COD2";
  if (value.includes("COD") || value.includes("COD1")) return "COD";

  return value || "UNKNOWN";
}

function normalizeServerItem(raw) {
  const server = raw || {};
  const gameId = normalizeGameId(server.game?.id || server.game || server.gameId || server.type || "");
  const rawName = safeText(server.name || server.hostname || "Unknown server");
  const map = safeText(server.map?.display || server.map?.name || server.map || "Unknown");
  const mode = safeText(server.mode?.display || server.mode?.name || server.gametype || server.mode || "Unknown");
  const players = Number(server.players?.current ?? server.currentPlayers ?? server.clients ?? 0);
  const maxPlayers = Number(server.players?.max ?? server.maxPlayers ?? server.sv_maxclients ?? 18);
  const address = safeText(server.address || server.connect || server.ip ? `${server.ip || ""}:${server.port || 0}` : "connect 127.0.0.1:28960");
  const client = safeText(server.client || getClientForGame(gameId).name || "Plutonium");
  const country = safeText(server.location?.countryName || server.country || "Unknown");
  const location = safeText(server.location?.city || server.location || country);

  return {
    id: safeText(server.id || address),
    name: rawName,
    map,
    mode,
    players,
    maxPlayers,
    client,
    address,
    country,
    location,
    gameId
  };
}

function sortServers(list) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (state.sort === "server") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (state.sort === "country") {
      return (a.country || "").localeCompare(b.country || "");
    }
    return (b.players || 0) - (a.players || 0);
  });
  return sorted;
}

function getVisibleServers() {
  let list = [...state.servers];

  if (state.selectedClient !== "All") {
    const games = CLIENT_CONFIG[state.selectedClient]?.games || [];
    list = list.filter(s => games.includes(s.gameId));
  }

  if (state.selectedGame !== "ALL") {
    list = list.filter(s => s.gameId === state.selectedGame);
  }

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter(s => {
      const text = [
        s.name, s.map, s.mode, s.client, s.address, s.country, s.location, s.gameId
      ].join(" ").toLowerCase();
      return text.includes(q);
    });
  }

  return sortServers(list);
}

function renderClientTabs() {
  if (!els.clientTabs) return;

  const clients = ["All", ...Object.keys(CLIENT_CONFIG)];
  els.clientTabs.innerHTML = clients.map((client) => {
    const active = state.selectedClient === client ? "active" : "";
    return `<button type="button" class="client-tab ${active}" data-client="${client}">${client === "All" ? "All clients" : client}</button>`;
  }).join("");
}

function renderGamePills() {
  if (!els.subGamePills) return;

  const gameIds = state.selectedClient === "All" ? GAME_ORDER : (CLIENT_CONFIG[state.selectedClient]?.games || GAME_ORDER);
  const countMap = {};

  state.servers.forEach((server) => {
    countMap[server.gameId] = (countMap[server.gameId] || 0) + 1;
  });

  els.subGamePills.innerHTML = gameIds.map((gameId) => {
    const active = state.selectedGame === gameId ? "active" : "";
    return `<button type="button" class="sub-game-pill ${active}" data-game="${gameId}">${gameId} <span>${countMap[gameId] || 0}</span></button>`;
  }).join("");
}

function renderServers() {
  const filtered = getVisibleServers();
  const totalPlayers = filtered.reduce((sum, s) => sum + Number(s.players || 0), 0);

  if (els.heroPlayers) els.heroPlayers.textContent = totalPlayers;
  if (els.heroServers) els.heroServers.textContent = filtered.length;

  if (els.serverCountLabel) {
    els.serverCountLabel.textContent = `${filtered.length} SERVERS`;
  }

  if (els.lastUpdated) {
    els.lastUpdated.textContent = `updated ${formatTime()} ago`;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const start = (state.page - 1) * ITEMS_PER_PAGE;
  const visible = filtered.slice(start, start + ITEMS_PER_PAGE);

  if (!visible.length) {
    els.servers.innerHTML = `<div class="server-card"><div class="server-row"><div style="color:var(--muted);padding:18px;">No servers found for this filter.</div></div></div>`;
    return;
  }

  els.servers.innerHTML = visible.map((server) => {
    const client = getClientForGame(server.gameId);
    const percent = server.maxPlayers > 0 ? clamp((server.players / server.maxPlayers) * 100, 0, 100) : 0;
    const favorite = state.favorites.has(server.id);
    const pillClass = client.name === "Plutonium" ? "plutonium" : client.name === "CoD4x" ? "cod4x" : "";

    return `
      <div class="server-card">
        <div class="server-row">
          <div class="server-main">
            <div class="server-square"></div>
            <div class="server-name-wrap">
              <div class="server-name">${safeText(server.name)}</div>
              <div class="server-sub">${safeText(server.location)} • ${safeText(server.country)}</div>
            </div>
          </div>

          <div class="map-mode">${safeText(server.map)} · ${safeText(server.mode)}</div>

          <div class="player-box">
            <span class="player-number-box">${safeText(server.players)}/${safeText(server.maxPlayers)}</span>
            <span class="player-progress"><span class="player-progress-fill" style="width:${percent}%;"></span></span>
          </div>

          <div>
            <span class="client-pill ${pillClass}">${client.name}</span>
          </div>

          <div class="connect-cell">
            <span class="connect-address">${safeText(server.address)}</span>
            <button class="favorite-btn ${favorite ? "active" : ""}" data-fav="${server.id}" type="button">${favorite ? "★" : "☆"}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function fetchServers() {
  const apiUrl = window.APP_CONFIG?.api?.servers || "https://gameserve.rs/api/v1/servers?limit=200&offset=0";

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("API unavailable");
    const json = await res.json();

    let rawList = [];
    if (Array.isArray(json)) rawList = json;
    else if (Array.isArray(json.servers)) rawList = json.servers;
    else if (Array.isArray(json.data?.servers)) rawList = json.data.servers;
    else if (Array.isArray(json.results)) rawList = json.results;

    const normalized = rawList.map(normalizeServerItem).filter(Boolean);

    state.servers = normalized;

    renderClientTabs();
    renderGamePills();
    renderServers();
    updateStatus();
    state.lastFetch = Date.now();

  } catch (error) {
    console.warn("Using fallback data", error);
    state.servers = [
      {
        id: "fallback-1",
        name: "BR - Sao Paulo - Mapvote & Mode - All Maps #2",
        map: "Magma",
        mode: "Team Deathmatch",
        players: 18,
        maxPlayers: 18,
        client: "Plutonium",
        address: "connect 82.38.28.22:28972",
        country: "Brazil",
        location: "São Paulo",
        gameId: "T6"
      },
      {
        id: "fallback-2",
        name: "Team |MGA| |S&D",
        map: "Search & Destroy",
        mode: "4hisglory",
        players: 18,
        maxPlayers: 32,
        client: "CoD4x",
        address: "connect 23.175.48.113:28968",
        country: "United States",
        location: "New York",
        gameId: "IW3"
      }
    ];
    renderClientTabs();
    renderGamePills();
    renderServers();
  }
}

function bindEvents() {
  els.clientTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".client-tab");
    if (!btn) return;
    const client = btn.dataset.client;
    state.selectedClient = client;
    state.selectedGame = "ALL";
    state.page = 1;
    renderClientTabs();
    renderGamePills();
    renderServers();
  });

  els.subGamePills.addEventListener("click", (e) => {
    const btn = e.target.closest(".sub-game-pill");
    if (!btn) return;
    const selected = btn.dataset.game;
    state.selectedGame = state.selectedGame === selected ? "ALL" : selected;
    state.page = 1;
    renderGamePills();
    renderServers();
  });

  els.topSearchBtn.addEventListener("click", () => {
    els.topSearchBar.classList.toggle("hidden");
    if (!els.topSearchBar.classList.contains("hidden")) {
      setTimeout(() => els.searchInput.focus(), 50);
    }
  });

  els.searchBtn.addEventListener("click", () => {
    state.search = els.searchInput.value.trim();
    state.page = 1;
    renderServers();
  });

  els.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    renderServers();
  });

  document.getElementById("sortButtons")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sort-pill");
    if (!btn) return;
    state.sort = btn.dataset.sort || "players";
    document.querySelectorAll(".sort-pill").forEach((pill) => pill.classList.toggle("active", pill.dataset.sort === state.sort));
    renderServers();
  });

  els.refreshBtn.addEventListener("click", () => fetchServers());

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fav]");
    if (btn) {
      const id = btn.getAttribute("data-fav");
      if (state.favorites.has(id)) state.favorites.delete(id);
      else state.favorites.add(id);
      saveFavorites();
      updateFavoriteBadge();
      renderServers();
      return;
    }
  });

  els.topFavBtn.addEventListener("click", () => {
    const current = document.body.dataset.favOnly === "true";
    document.body.dataset.favOnly = String(!current);
    const favsOnly = document.body.dataset.favOnly === "true";
    if (favsOnly) {
      const filtered = getVisibleServers().filter(server => state.favorites.has(server.id));
      state.servers = filtered;
      renderServers();
    } else {
      fetchServers();
    }
    updateFavoriteBadge();
  });

  els.darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const dark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", dark ? "yes" : "no");
  });
}

function updateFavoriteBadge() {
  const size = state.favorites.size;
  if (!els.favBadge) return;
  if (size > 0) {
    els.favBadge.textContent = size;
    els.favBadge.style.display = "flex";
  } else {
    els.favBadge.style.display = "none";
  }
}

function initTheme() {
  const saved = localStorage.getItem("darkMode");
  const dark = saved !== "no";
  document.body.classList.toggle("dark-mode", dark);
}

(function init() {
  initTheme();
  updateFavoriteBadge();
  bindEvents();
  renderClientTabs();
  renderGamePills();
  fetchServers();
  setInterval(updateStatus, 30000);
})();
