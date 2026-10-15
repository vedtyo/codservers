let allServers = [];
let lastFetchTimestamp = Date.now();
let initialRoute = parseRoute();
let selectedClient = initialRoute.client;
let selectedGame = initialRoute.gameId;
let currentPage = initialRoute.page;
let searchQuery = initialRoute.query;
let currentSort = "players";
let sortDescending = true;
let expandedServerId = null;
let isFavOnly = false;
let isHideTrickshot = false;
let selectedFilterColumn = "";

let favorites = new Set();
try {
    const savedFavs = JSON.parse(localStorage.getItem("favoriteServers") || "[]");
    if (Array.isArray(savedFavs)) favorites = new Set(savedFavs);
} catch (e) {
    favorites = new Set();
}

function saveFavorites() {
    try {
        localStorage.setItem("favoriteServers", JSON.stringify(Array.from(favorites)));
    } catch (e) {
        console.error("Could not save favorites:", e);
    }
}

function toggleFavorite(serverId, event) {
    if (event) event.stopPropagation();
    if (favorites.has(serverId)) {
        favorites.delete(serverId);
    } else {
        favorites.add(serverId);
    }
    saveFavorites();
    updateFavoritesUI();
    updateStatsOverview();
    renderServers();
}

function updateFavoritesUI() {
    const favBtn = document.getElementById("topFavBtn");
    const favBadge = document.getElementById("favBadge");
    if (favBtn) {
        favBtn.classList.toggle("active", isFavOnly);
    }
    if (favBadge) {
        if (favorites.size > 0) {
            favBadge.textContent = favorites.size;
            favBadge.style.display = "flex";
        } else {
            favBadge.style.display = "none";
        }
    }
}

function getRelativeTimeString(timestamp) {
    if (!timestamp) return "updated just now";
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return "updated just now";
    if (diffSec < 15) return "updated 10s ago";
    if (diffSec < 20) return "updated 15s ago";
    return `updated ${Math.floor(diffSec / 5) * 5}s ago`;
}

function updateRelativeTimeDisplays() {
    const text = getRelativeTimeString(lastFetchTimestamp);
    document.querySelectorAll(".updated-time-text").forEach(el => {
        el.textContent = text;
    });
}

setInterval(updateRelativeTimeDisplays, 1000);

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

let currentAnimatedPlayers = 0;
let currentAnimatedServers = 0;

function animateNumberValue(element, start, end, duration = 400) {
    if (!element) return;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const currentVal = Math.round(start + (end - start) * easeProgress);

        element.textContent = currentVal.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = end.toLocaleString();
        }
    }

    requestAnimationFrame(step);
}

function updateStatsOverview(filteredServersList = null) {
    const heroPlayers = document.getElementById("heroPlayers");
    const heroServers = document.getElementById("heroServers");

    let targetServersList = filteredServersList;
    if (!targetServersList) {
        targetServersList = [...allServers];
        if (selectedClient !== "All" && CLIENT_CONFIG[selectedClient]) {
            const allowedGames = CLIENT_CONFIG[selectedClient].games;
            targetServersList = targetServersList.filter(s => allowedGames.includes(s.game.id));
        }
        if (selectedGame !== "ALL") {
            targetServersList = targetServersList.filter(s => s.game.id === selectedGame);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            targetServersList = targetServersList.filter(server => {
                const client = getClientForGame(server.game.id);
                const text = [
                    server.name, stripCodColors(server.name), server.address, server.ip,
                    server.game.name, server.game.id, client?.name || "",
                    server.map.display, server.mode.display,
                    server.location.countryName, server.location.countryCode
                ].join(" ").toLowerCase();
                return text.includes(q);
            });
        }
        if (isFavOnly) {
            targetServersList = targetServersList.filter(s => favorites.has(s.id));
        }
    }

    const targetServers = targetServersList.length;
    const targetPlayers = targetServersList.reduce((sum, s) => sum + Number(s.players.current || 0), 0);

    if (heroPlayers) {
        animateNumberValue(heroPlayers, currentAnimatedPlayers, targetPlayers);
        currentAnimatedPlayers = targetPlayers;
    }
    if (heroServers) {
        animateNumberValue(heroServers, currentAnimatedServers, targetServers);
        currentAnimatedServers = targetServers;
    }
}

/* =====================================================
   HELPERS & SECURITY
===================================================== */
function scrollToGameTitle() {
    const title = document.querySelector(".game-title");
    if (!title) return;

    const topBar = document.getElementById("top-bar");
    const offset = (topBar ? topBar.getBoundingClientRect().height : 0) + 12;
    const top = title.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function getSlugForGame(gameId) {
    if (!gameId || gameId === "ALL") return "";
    return GAME_SLUGS[gameId] || gameId;
}

function getShortGameName(id) {
    return SHORT_GAME_NAMES[id] || id;
}

function getFullGameName(id) {
    return FULL_GAME_NAMES[id] || SHORT_GAME_NAMES[id] || id;
}

function escapeHtml(text) {
    if (text == null) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const COD_COLORS = {
    '0': true,
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
    '9': true
};

function stripCodColors(text) {
    if (text == null) return "";
    return String(text).replace(/\^([0-9a-zA-Z])/g, "").replace(/\^\^/g, "^");
}

function renderCodColors(text) {
    if (text == null) return "";
    const str = String(text);
    let result = "";
    let currentColor = null;
    let i = 0;

    while (i < str.length) {
        if (str[i] === '^') {
            if (i + 1 < str.length) {
                const nextChar = str[i + 1];
                if (nextChar === '^') {
                    const escaped = escapeHtml('^');
                    result += currentColor ? `<span class="cod-color-${currentColor}">${escaped}</span>` : escaped;
                    i += 2;
                    continue;
                } else if (COD_COLORS[nextChar]) {
                    currentColor = nextChar;
                    i += 2;
                    continue;
                }
            }
        }

        let nextCarat = str.indexOf('^', i);
        if (nextCarat === -1) nextCarat = str.length;

        if (nextCarat === i) {
            const escaped = escapeHtml(str[i]);
            result += currentColor ? `<span class="cod-color-${currentColor}">${escaped}</span>` : escaped;
            i++;
            continue;
        }

        const segment = str.substring(i, nextCarat);
        if (segment) {
            const escaped = escapeHtml(segment);
            result += currentColor ? `<span class="cod-color-${currentColor}">${escaped}</span>` : escaped;
        }
        i = nextCarat;
    }

    return result || escapeHtml(str);
}

/* =====================================================
   ROUTING
===================================================== */
function parseRoute() {
    const rawPath = (
        window.location.pathname.replace(/^\/+|\/+$/g, '') ||
        window.location.hash.replace(/^#+/, '')
    ).trim();

    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || "";

    if (!rawPath) {
        return { client: "All", gameId: "ALL", page: 1, query: q };
    }

    const parts = rawPath.split('/').filter(Boolean);
    let client = "All";
    let gameId = "ALL";
    let page = 1;

    parts.forEach(part => {
        const lower = part.toLowerCase();
        if (lower === "index.html" || lower === "index.htm") {
            return;
        }
        if (lower.startsWith('page-')) {
            const p = parseInt(lower.replace('page-', ''), 10);
            if (!isNaN(p) && p > 0) page = p;
        } else if (/^\d+$/.test(lower)) {
            const p = parseInt(lower, 10);
            if (!isNaN(p) && p > 0) page = p;
        } else if (CLIENT_CONFIG[Object.keys(CLIENT_CONFIG).find(k => k.toLowerCase() === lower)]) {
            const matchedKey = Object.keys(CLIENT_CONFIG).find(k => k.toLowerCase() === lower);
            client = matchedKey;
        } else if (SLUG_TO_GAME[lower]) {
            gameId = SLUG_TO_GAME[lower];
            const c = getClientForGame(gameId);
            if (c && c.key !== "Unknown") client = c.key;
        } else if (lower !== "all") {
            gameId = part.toUpperCase();
            const c = getClientForGame(gameId);
            if (c && c.key !== "Unknown") client = c.key;
        }
    });

    return { client, gameId, page, query: q };
}

function updateRouteUrl(client, gameId, page, query, pushState = true) {
    let path = "/";

    const clientLower = client && client !== "All" ? client.toLowerCase() : "";
    const gameSlug = getSlugForGame(gameId);

    if (clientLower && gameSlug) {
        path = `/${clientLower}/${gameSlug}`;
    } else if (clientLower) {
        path = `/${clientLower}`;
    } else if (gameSlug) {
        path = `/${gameSlug}`;
    }

    if (page > 1) {
        path += (path.endsWith('/') ? '' : '/') + `page-${page}`;
    }

    if (query && query.trim()) {
        path += `?q=${encodeURIComponent(query.trim())}`;
    }

    const currentFullUrl = window.location.pathname + window.location.search;
    if (pushState && currentFullUrl !== path) {
        history.pushState({ client, gameId, page, query }, '', path);
    }
}

window.addEventListener('popstate', () => {
    const route = parseRoute();
    selectedClient = route.client;
    selectedGame = route.gameId;
    currentPage = route.page;
    searchQuery = route.query;

    const input = document.getElementById("searchInput");
    if (input) input.value = searchQuery;

    expandedServerId = null;
    renderClientTabs();
    renderSubGamePills();
    renderServers();
    scrollToGameTitle();
});

/* =====================================================
   FETCH DATA
===================================================== */
async function loadServers() {
    initIpGeoEngine();

    const status = document.getElementById("status");

    let fetchError = null;
    let combinedServers = [];

    try {
        const timestamp = Date.now();
        const limit = 500;
        const firstUrl = `https://gameserve.rs/api/v1/servers?limit=${limit}&offset=0&t=${timestamp}`;
        const firstResp = await fetch(firstUrl, { cache: "no-store" });

        if (firstResp.ok) {
            const firstData = await firstResp.json();
            combinedServers = combinedServers.concat(normalizeMasterData(firstData));

            const totalServers = firstData?.data?.pagination?.total || 0;

            if (totalServers > limit) {
                const promises = [];
                for (let offset = limit; offset < totalServers; offset += limit) {
                    const url = `https://gameserve.rs/api/v1/servers?limit=${limit}&offset=${offset}&t=${timestamp}`;
                    promises.push(
                        fetch(url, { cache: "no-store" })
                            .then(res => res.ok ? res.json() : null)
                            .catch(err => {
                                console.warn(`Failed fetching offset ${offset}:`, err);
                                return null;
                            })
                    );
                }

                const pagesData = await Promise.all(promises);
                pagesData.forEach(pData => {
                    if (pData) {
                        combinedServers = combinedServers.concat(normalizeMasterData(pData));
                    }
                });
            }
        }
    } catch (e) {
        fetchError = e;
        console.warn("Failed fetching from gameserve.rs:", e);
    }

    if (combinedServers.length > 0) {
        lastFetchTimestamp = Date.now();

        /* Deduplicate by IP:port address */
        const unique = new Map();
        combinedServers.forEach(server => {
            const key = server.address || server.id;
            if (key && !unique.has(key)) {
                unique.set(key, server);
            }
        });

        allServers = Array.from(unique.values());

        const route = parseRoute();
        selectedClient = route.client;
        selectedGame = route.gameId;
        currentPage = route.page;
        searchQuery = route.query;

        const input = document.getElementById("searchInput");
        if (input) input.value = searchQuery;

        renderClientTabs();
        renderSubGamePills();
        renderServers();

        if (status) {
            status.textContent = `Updated ${new Date().toLocaleTimeString()}`;
        }

        updateStatsOverview();
    } else {
        console.error("Master API error:", fetchError);
        if (status) status.textContent = "Server API unavailable.";
        document.getElementById("servers").innerHTML = `
            <div class="no-results">
                Unable to load server list from API.
                <br><br>
                <small>${escapeHtml(fetchError ? fetchError.message : "Network error")}</small>
            </div>
        `;
    }
}

/* =====================================================
   NORMALIZE MASTER DATA
===================================================== */
function normalizeMasterData(data) {
    if (!data) return [];
    const output = [];

    let servers = [];
    if (data.data && Array.isArray(data.data.servers)) {
        servers = data.data.servers;
    } else if (Array.isArray(data.servers)) {
        servers = data.servers;
    } else if (Array.isArray(data)) {
        servers = data;
    }

    servers.forEach(server => {
        if (!server) return;

        const rawGameObj = server.game || {};
        const rawGameId = typeof rawGameObj === "object" ? (rawGameObj.id || "UNKNOWN") : String(rawGameObj);
        const rawGameName = typeof rawGameObj === "object" ? (rawGameObj.name || rawGameId) : String(rawGameObj);

        const ip = server.ip || "";
        const port = Number(server.port || 0);
        const address = server.address || (ip && port ? `${ip}:${port}` : ip);
        const id = server.id || address;

        const playersObj = server.players || {};
        const current = Number(typeof playersObj === "object" ? (playersObj.current ?? 0) : playersObj);
        const max = Number(typeof playersObj === "object" ? (playersObj.max ?? 0) : 0);

        const mapObj = server.map || {};
        const mapRaw = typeof mapObj === "object" ? (mapObj.raw || mapObj.display || "Unknown") : String(mapObj);
        const mapDisplay = typeof mapObj === "object" ? (mapObj.display || mapObj.raw || "Unknown") : String(mapObj);

        const modeObj = server.mode || {};
        const modeRaw = typeof modeObj === "object" ? (modeObj.raw || modeObj.display || "Unknown") : String(modeObj);
        const modeDisplay = typeof modeObj === "object" ? (modeObj.display || modeObj.raw || "Unknown") : String(modeObj);

        const locationObj = server.location || {};
        const rawCountryCode = locationObj.countryCode || lookupCountryCodeByIp(ip);
        const forcedCountry = getForcedCountryByIp(ip);
        const countryCode = (forcedCountry || rawCountryCode || "").toUpperCase();
        const countryName = locationObj.countryName || getCountryNameByCode(countryCode);
        const city = locationObj.cityName || lookupCityByIp(ip) || "";

        const normalizedGame = normalizeGame(rawGameId, server);

        const pingVal = Number(server.ping || server.latency || 0);

        output.push({
            id: id,
            name: server.name || server.hostname || "Unknown Server",
            ip: ip,
            port: port,
            address: address,
            game: {
                id: normalizedGame,
                name: rawGameName
            },
            players: {
                current: current,
                max: max
            },
            map: {
                raw: mapRaw,
                display: mapDisplay
            },
            mode: {
                raw: modeRaw,
                display: modeDisplay
            },
            location: {
                countryName: countryName,
                countryCode: countryCode,
                city: city
            },
            ping: pingVal,
            version: server.version || "",
            validConnection: true,
            webfront: "",
            instanceInfo: {
                uptime: 0,
                lastHeartbeat: 0,
                ipAddress: ip
            }
        });
    });

    /* Deduplicate by IP:port address */
    const unique = new Map();
    output.forEach(server => {
        const key = server.address || server.id;
        if (key && !unique.has(key)) {
            unique.set(key, server);
        }
    });

    return Array.from(unique.values());
}

/* =====================================================
   NORMALIZE COD.PM DATA
===================================================== */
function normalizeCodPmData(data) {
    if (!data || !data.servers) return [];
    const output = [];
    const gameMapping = {
        "cod": "COD",
        "coduo": "CODUO",
        "cod2": "COD2",
        "cod4": "IW3"
    };

    const processServerItem = (server, defaultGameKey = "COD", defaultVersion = "") => {
        if (!server || !server.ip || !server.port) return;

        const rawGame = String(server.game || defaultGameKey).toLowerCase();
        const gameId = gameMapping[rawGame] || rawGame.toUpperCase();

        const ip = String(server.ip).trim();
        const port = Number(server.port);
        const address = `${ip}:${port}`;
        const id = address;
        const current = Number(server.clients || 0);
        const max = Number(server.sv_maxclients || 0);

        const forcedCountry = getForcedCountryByIp(ip);
        const geoip = server.geoip || {};
        const countryIso = server.country_isocode || geoip.country_alpha2;
        const countryCode = forcedCountry || (countryIso ? String(countryIso).toUpperCase() : lookupCountryCodeByIp(ip));
        const countryName = getCountryNameByCode(countryCode) || server.country_name || geoip.country_name || "";
        const city = server.city_name || geoip.city_name || lookupCityByIp(ip) || "";

        output.push({
            id: id,
            name: server.sv_hostname || "Unknown Server",
            ip: ip,
            port: port,
            address: address,
            game: {
                id: gameId,
                name: rawGame
            },
            players: {
                current: current,
                max: max
            },
            map: {
                raw: server.mapname || "Unknown",
                display: server.mapname || "Unknown"
            },
            mode: {
                raw: server.g_gametype || "Unknown",
                display: server.g_gametype || "Unknown"
            },
            location: {
                countryName: countryName,
                countryCode: countryCode,
                city: city
            },
            version: server.shortversion || server.gameversion || defaultVersion || "",
            validConnection: true,
            webfront: server.url || "",
            instanceInfo: {
                uptime: 0,
                lastHeartbeat: 0,
                ipAddress: ip
            }
        });
    };

    const serversObj = data.servers;

    if (Array.isArray(serversObj)) {
        serversObj.forEach(server => processServerItem(server, "COD", ""));
    } else if (typeof serversObj === 'object') {
        for (const [gameOrVersionKey, val] of Object.entries(serversObj)) {
            if (Array.isArray(val)) {
                val.forEach(server => processServerItem(server, gameOrVersionKey, gameOrVersionKey));
            } else if (val && typeof val === 'object') {
                for (const [versionKey, serverList] of Object.entries(val)) {
                    if (Array.isArray(serverList)) {
                        serverList.forEach(server => processServerItem(server, gameOrVersionKey, versionKey));
                    }
                }
            }
        }
    }

    return output;
}

/* =====================================================
   NORMALIZE GAME
===================================================== */
function normalizeGame(game, server = {}) {
    const gameText = String(game || "").toLowerCase();
    const modeText = String(server.gametype || server.mode || "").toLowerCase();
    const mapText = String(server.map || "").toLowerCase();
    const combined = `${gameText} ${modeText} ${mapText}`;

    if (
        combined.includes("t6zm") || combined.includes("bo2zm") ||
        combined.includes("blackops2z") || combined.includes("zombies") ||
        combined.includes("zombie") || combined.includes("zm_") ||
        combined.includes("zmb")
    ) {
        if (gameText.includes("t6") || gameText.includes("bo2") || gameText.includes("blackops2")) return "T6ZM";
        if (gameText.includes("t5") || gameText.includes("bo1") || gameText.includes("blackops")) return "T5ZM";
        if (gameText.includes("t4") || gameText.includes("waw") || gameText.includes("worldatwar")) return "T4ZM";
    }

    if (gameText === "t6" || gameText.includes("plutot6") || gameText.includes("bo2") || gameText.includes("blackops2")) return "T6";
    if (gameText === "t5" || gameText.includes("bo1")) return "T5";
    if (gameText === "t4" || gameText.includes("waw") || gameText.includes("worldatwar")) return "T4";
    if (gameText.includes("iw5") || gameText.includes("mw3")) return "IW5";
    if (gameText.includes("iw4") || gameText.includes("mw2")) return "IW4";
    if (gameText.includes("iw3") || gameText.includes("cod4")) return "IW3";
    if (gameText.includes("iw6") || gameText.includes("ghosts")) return "IW6";
    if (gameText.includes("h2m") || gameText.includes("hmw")) return "H2M";
    if (gameText.includes("t7") || gameText.includes("bo3")) return "T7";
    if (gameText.includes("h1") || gameText.includes("mwr")) return "H1";
    if (gameText.includes("iw7")) return "IW7";
    if (gameText.includes("shg1") || gameText === "s1" || gameText.includes("s1-mod") || gameText.includes("aw")) return "SHG1";
    if (gameText.includes("s2") || gameText.includes("wwii")) return "S2";
    if (gameText === "cod" || gameText === "cod1") return "COD";
    if (gameText === "cod2") return "COD2";
    if (gameText === "coduo") return "CODUO";

    return String(game || "UNKNOWN").toUpperCase();
}

/* =====================================================
   CLIENT TABS & GAME SUB-PILLS
===================================================== */
const CLIENT_LIST = [
    "All",
    "IW4x",
    "Plutonium",
    "AlterWare",
    "Aurora",
    "HorizonMW",
    "S2x",
    "CoD4x",
    "CoD1",
    "CoD2",
    "CoDUO"
];

function renderClientTabs() {
    const container = document.getElementById("clientTabs");
    if (!container) return;
    container.innerHTML = "";

    CLIENT_LIST.forEach(clientKey => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "client-tab";
        if (selectedClient === clientKey) btn.classList.add("active");

        const clientData = CLIENT_CONFIG[clientKey];
        if (clientData && selectedClient === clientKey) {
            btn.style.setProperty("--client-color", clientData.color);
        } else {
            btn.style.removeProperty("--client-color");
        }

        const label = clientKey === "All" ? "All clients" : clientKey;
        btn.textContent = label;

        btn.onclick = () => {
            selectedClient = clientKey;
            selectedGame = "ALL";
            currentPage = 1;
            expandedServerId = null;
            updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
            renderClientTabs();
            renderSubGamePills();
            renderServers();
        };

        container.appendChild(btn);
    });
}

function renderSubGamePills() {
    const container = document.getElementById("subGamePills");
    if (!container) return;
    container.innerHTML = "";

    // Determine which games belong to current client view
    let availableGames = GAME_ORDER;
    if (selectedClient !== "All" && CLIENT_CONFIG[selectedClient]) {
        availableGames = CLIENT_CONFIG[selectedClient].games;
    }

    const gameStats = {};
    allServers.forEach(server => {
        const gid = server.game.id;
        if (!gameStats[gid]) {
            gameStats[gid] = { servers: 0, players: 0 };
        }
        gameStats[gid].servers++;
        gameStats[gid].players += Number(server.players.current || 0);
    });

    availableGames.forEach(gameId => {
        const stats = gameStats[gameId] || { servers: 0, players: 0 };
        const dotColor = GAME_DOT_COLORS[gameId] || "#8c939e";

        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "game-pill";
        if (selectedGame === gameId) pill.classList.add("active");

        pill.style.setProperty("--dot-color", dotColor);

        pill.innerHTML = `
            <span class="game-pill-dot"></span>
            <span class="game-pill-code">${escapeHtml(gameId)}</span>
            <span class="game-pill-count">${stats.players}</span>
        `;

        pill.onclick = () => {
            if (selectedGame === gameId) {
                selectedGame = "ALL";
            } else {
                selectedGame = gameId;
            }
            currentPage = 1;
            expandedServerId = null;
            updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
            renderSubGamePills();
            renderServers();
        };

        container.appendChild(pill);
    });
}

/* =====================================================
   RENDER SERVERS
===================================================== */
function renderServers() {
    const container = document.getElementById("servers");
    container.innerHTML = "";

    let servers = [...allServers];

    if (selectedClient !== "All" && CLIENT_CONFIG[selectedClient]) {
        const allowedGames = CLIENT_CONFIG[selectedClient].games;
        servers = servers.filter(s => allowedGames.includes(s.game.id));
    }

    if (selectedGame !== "ALL") {
        servers = servers.filter(s => s.game.id === selectedGame);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        servers = servers.filter(server => {
            const client = getClientForGame(server.game.id);
            const text = [
                server.name, stripCodColors(server.name), server.address, server.ip,
                server.game.name, server.game.id, client?.name || "",
                server.map.display, server.mode.display,
                server.location.countryName, server.location.countryCode
            ].join(" ").toLowerCase();
            return text.includes(q);
        });
    }

    if (isFavOnly) {
        servers = servers.filter(s => favorites.has(s.id));
    }

    servers.sort(sortServers);

    updateStatsOverview(servers);
    updateSearchResultsBanner(servers);

    if (!servers.length) {
        container.innerHTML = `<div class="no-results">No servers found for this client/game/filter.</div>`;
        return;
    }

    const totalPages = Math.ceil(servers.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageServers = servers.slice(start, start + ITEMS_PER_PAGE);

    const gameGroups = {};
    pageServers.forEach(server => {
        const game = server.game.id;
        if (!gameGroups[game]) gameGroups[game] = [];
        gameGroups[game].push(server);
    });

    Object.entries(gameGroups).forEach(([game, gameServers]) => {
        const allGameServers = servers.filter(server => server.game.id === game);
        const totalGameServers = allGameServers.length;
        const totalGamePlayers = allGameServers.reduce((a, s) => a + Number(s.players.current || 0), 0);

        renderGame(game, gameServers, container, totalGameServers, totalGamePlayers);
    });

    renderPagination(container, servers.length, totalPages, start);
}

/* =====================================================
   GAME TABLE
===================================================== */
function getPing(server) {
    if (typeof server.ping === 'number' && server.ping > 0) return server.ping;
    let hash = 0;
    const str = server.address || server.id || "";
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return 15 + (Math.abs(hash) % 75);
}

function renderGame(game, servers, container, totalGameServers = servers.length, totalGamePlayers = 0) {
    const gameElement = document.createElement("div");
    gameElement.className = "game";

    const clientData = getClientForGame(game);
    const dotColor = GAME_DOT_COLORS[game] || clientData.color || "#8c939e";

    const title = document.createElement("h2");
    title.className = "game-title";

    const gameFullName = getFullGameName(game);
    const relativeText = getRelativeTimeString(lastFetchTimestamp);

    title.innerHTML = `
        <span class="game-title-left">
            <span class="game-title-dot" style="background-color: ${dotColor};"></span>
            <span class="game-title-name">${escapeHtml(gameFullName)}</span>
            <span class="game-title-stats">${totalGameServers} servers · ${totalGamePlayers} players</span>
            <a href="${escapeHtml(clientData.url)}" target="_blank" rel="noopener noreferrer" class="game-title-client" style="color: ${clientData.color};">
                ${escapeHtml(clientData.name)}
                <svg class="external-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            </a>
            <span class="game-title-updated">
                <span class="updated-time-text">${escapeHtml(relativeText)}</span>
                <button type="button" class="inline-refresh-btn" onclick="loadServers()">
                    <svg class="refresh-arrows-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
                    Refresh
                </button>
            </span>
        </span>
    `;

    gameElement.appendChild(title);

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";

    const getSortArrow = () => "";
    const getSortClass = (type) => (currentSort === type ? ' class="sorted"' : '');

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th class="col-server"${getSortClass('server')} onclick="sortBy('server')">SERVER${getSortArrow()}</th>
                <th class="col-map"${getSortClass('map')} onclick="sortBy('map')">MAP AND MODE${getSortArrow()}</th>
                <th class="col-players"${getSortClass('players')} onclick="sortBy('players')">PLAYERS${getSortArrow()}</th>
                <th class="col-client">CLIENT</th>
                <th class="col-connect">CONNECT</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement("tbody");

    servers.forEach((server) => {
        const id = server.id;
        const current = server.players.current;
        const max = server.players.max;

        let playerClass = "player-empty";
        let statusBadgeText = "";
        if (max > 0 && current >= max) {
            playerClass = "player-full";
            statusBadgeText = "FULL";
        } else if (current >= 9) {
            playerClass = "player-medium";
        } else if (current > 0) {
            playerClass = "player-low";
        }

        const countryCode = server.location.countryCode;
        const countryName = server.location.countryName;
        const isFav = favorites.has(id);
        const starIcon = isFav ? "★" : "☆";
        const starClass = isFav ? "fav-button is-favorite" : "fav-button";

        const clientData = getClientForGame(server.game.id);

        const row = document.createElement("tr");
        row.className = "server-row";

        row.innerHTML = `
            <td class="col-server-cell">
                <div class="server-title-container">
                    ${getCountryFlag(countryCode, countryName)}
                    <span class="expand-icon" title="Toggle detailed info">
                        ${expandedServerId === id
                            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>'
                            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
                        }
                    </span>
                    <span class="server-title-text">${renderCodColors(server.name)}</span>
                    <button type="button" class="fav-button mobile-fav-button ${isFav ? 'is-favorite' : ''}" data-fav-id="${escapeHtml(id)}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${starIcon}</button>
                </div>
            </td>
            <td class="col-map-cell">
                <span class="map-mode-text">${escapeHtml(server.map.display)} · ${escapeHtml(server.mode.display)}</span>
            </td>
            <td class="col-players-cell">
                <div class="player-bar-container">
                    <span class="player-num-box ${playerClass}">${current}/${max}</span>
                    <div class="player-progress-bar"><div class="player-progress-fill ${playerClass}" style="width: ${max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0}%;"></div></div>
                    ${statusBadgeText ? `<span class="player-status-tag ${playerClass}">${statusBadgeText}</span>` : ""}
                </div>
            </td>
            <td class="col-client-cell">
                <span class="client-pill" style="--client-color: ${clientData.color}">${escapeHtml(clientData.name)}</span>
            </td>
            <td class="col-mobile-meta">
                <div class="mobile-player-group">
                    <span class="player-num-box ${playerClass}"><span>${current}</span><span class="mobile-player-divider">/</span><span>${max}</span></span>
                    <div class="player-progress-bar mobile-player-bar"><div class="player-progress-fill ${playerClass}" style="width: ${max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0}%;"></div></div>
                    ${statusBadgeText ? `<span class="player-status-tag ${playerClass}">${statusBadgeText}</span>` : ""}
                </div>
                <span class="client-pill" style="--client-color: ${clientData.color}">${escapeHtml(clientData.name)}</span>
                ${getCountryFlag(countryCode, countryName)}
            </td>
            <td class="col-connect-cell">
                <div class="connect-action-box">
                    <span class="copy-container">
                        <span class="connect-mobile-label">connect</span>
                        <span class="connect-command">${escapeHtml(server.address)}</span>
                        <button class="copy-button" type="button" data-copy-address="${escapeHtml(server.address)}" title="Copy connect command" aria-label="Copy connect command">⧉</button>
                        <span class="copy-toast">copied, paste in console</span>
                    </span>
                    <button type="button" class="${starClass}" data-fav-id="${escapeHtml(id)}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${starIcon}</button>
                </div>
            </td>
        `;

        row.onclick = (e) => {
            if (e && e.target && (e.target.closest(".fav-button") || e.target.closest(".copy-button") || e.target.closest("a"))) return;
            toggleServer(id);
        };
        tbody.appendChild(row);

        if (expandedServerId === id) {
            tbody.appendChild(createDetailsRow(server));
        }
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    gameElement.appendChild(tableContainer);
    container.appendChild(gameElement);
}

/* =====================================================
   DETAILS ROW
===================================================== */
function createDetailsRow(server) {
    const row = document.createElement("tr");
    row.className = "details-row";

    const cell = document.createElement("td");
    cell.colSpan = 6;

    const details = document.createElement("div");
    details.className = "details";

    const countryLabel =
        server.location.countryName ||
        server.location.countryCode ||
        "Unknown";

    const cityLabel = server.location.city || "";

    const hasPlayers = Number(server.players.current || 0) > 0;
    const isOnline = hasPlayers || server.validConnection;
    const statusClass = isOnline ? "status-online" : "status-offline";
    const statusText = isOnline ? "Online" : "Offline / Intermittent";

    const clientData = getClientForGame(server.game.id);

    details.innerHTML = `
        <p><strong>Server:</strong> ${renderCodColors(server.name)}</p>
        <p class="details-connect-row">
            <strong>Connect:</strong>
            ${server.address
                ? `<span class="copy-container details-connect-copy">
                       <span class="connect-command">${escapeHtml(server.address)}</span>
                       <button class="copy-button" type="button" data-copy-address="${escapeHtml(server.address)}" title="Copy connect command" aria-label="Copy connect command">⧉</button>
                       <span class="copy-toast">copied, paste in console</span>
                   </span>`
                : escapeHtml(server.address)}
        </p>
        <p><strong>Client:</strong> <a href="${escapeHtml(clientData.url)}" target="_blank" rel="noopener noreferrer" style="color: ${clientData.color}; font-weight: 700; text-decoration: none;">${escapeHtml(clientData.name)} <svg class="external-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></a></p>
        <p><strong>Game:</strong> ${escapeHtml(getShortGameName(server.game.id))} (${escapeHtml(getFullGameName(server.game.id))})</p>
        <p><strong>Players:</strong> ${server.players.current} / ${server.players.max}</p>
        <p><strong>Map:</strong> ${escapeHtml(server.map.display)}</p>
        <p><strong>Mode:</strong> ${escapeHtml(server.mode.display)}</p>
        <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
        <p><strong>Country:</strong> ${escapeHtml(countryLabel)}${cityLabel ? ` (${escapeHtml(cityLabel)})` : ""}</p>
        ${cityLabel ? `<p><strong>City:</strong> ${escapeHtml(cityLabel)}</p>` : ""}
        ${server.version ? `<p><strong>Version:</strong> ${escapeHtml(server.version)}</p>` : ""}
        ${server.webfront
            ? `<p><strong>Webfront:</strong> <a href="${escapeHtml(server.webfront)}" target="_blank" rel="noopener noreferrer" style="color:inherit;">${escapeHtml(server.webfront)}</a></p>`
            : ""
        }
        ${server.instanceInfo.uptime ? `<p><strong>Uptime:</strong> ${formatUptime(server.instanceInfo.uptime)}</p>` : ""}
        ${server.instanceInfo.lastHeartbeat
            ? `<p><strong>Last Heartbeat:</strong> ${new Date(server.instanceInfo.lastHeartbeat * 1000).toLocaleString()}</p>`
            : ""
        }
    `;

    cell.appendChild(details);
    row.appendChild(cell);
    return row;
}

/* =====================================================
   UPTIME FORMATTING
===================================================== */
function formatUptime(seconds) {
    if (!seconds || seconds <= 0) return "N/A";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

/* =====================================================
   PAGINATION
===================================================== */
function renderPagination(container, total, pages, start) {
    if (pages <= 1) return;

    const div = document.createElement("div");
    div.className = "pagination-container";

    const info = document.createElement("div");
    info.textContent = `Showing ${start + 1}-${Math.min(start + ITEMS_PER_PAGE, total)} of ${total} servers`;

    const buttons = document.createElement("div");
    buttons.className = "pagination-buttons";

    const previous = document.createElement("button");
    previous.className = "pagination-button";
    previous.textContent = "« Previous";
    previous.disabled = currentPage === 1;
    previous.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            expandedServerId = null;
            updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
            renderServers();
            scrollToGameTitle();
        }
    };
    buttons.appendChild(previous);

    const pageWindow = [1];
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(pages - 1, currentPage + 1);

    if (currentPage <= 3) {
        rangeEnd = Math.min(pages - 1, 4);
    } else if (currentPage >= pages - 2) {
        rangeStart = Math.max(2, pages - 3);
    }

    if (rangeStart > 2) pageWindow.push('...');
    for (let p = rangeStart; p <= rangeEnd; p++) pageWindow.push(p);
    if (rangeEnd < pages - 1) pageWindow.push('...');
    if (pages > 1) pageWindow.push(pages);

    pageWindow.forEach(item => {
        if (item === '...') {
            const span = document.createElement("span");
            span.className = "pagination-ellipsis";
            span.textContent = "...";
            buttons.appendChild(span);
        } else {
            const button = document.createElement("button");
            button.className = "pagination-button";
            if (item === currentPage) button.classList.add("active");
            button.textContent = item;
            button.onclick = () => {
                currentPage = item;
                expandedServerId = null;
                updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
                renderServers();
                scrollToGameTitle();
            };
            buttons.appendChild(button);
        }
    });

    const next = document.createElement("button");
    next.className = "pagination-button";
    next.textContent = "Next »";
    next.disabled = currentPage === pages;
    next.onclick = () => {
        if (currentPage < pages) {
            currentPage++;
            expandedServerId = null;
            updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
            renderServers();
            scrollToGameTitle();
        }
    };
    buttons.appendChild(next);

    div.appendChild(info);
    div.appendChild(buttons);
    container.appendChild(div);
}

/* =====================================================
   SORTING
===================================================== */
function updateSortUI() {
    const sortContainer = document.getElementById("sortButtons");
    if (!sortContainer) return;

    sortContainer.querySelectorAll(".sort-pill").forEach(btn => {
        const sortType = btn.dataset.sort;
        if (sortType === currentSort) {
            btn.classList.add("active");
            const arrow = sortDescending ? "↓" : "↑";
            btn.innerHTML = `${getSortLabel(sortType)} <span class="sort-arrow">${arrow}</span>`;
        } else {
            btn.classList.remove("active");
            btn.textContent = getSortLabel(sortType);
        }
    });
}

function getSortLabel(type) {
    switch (type) {
        case "players": return "Players";
        case "server": return "Name";
        case "country": return "Country";
        case "map": return "Map";
        case "mode": return "Mode";
        case "game": return "Game";
        default: return type;
    }
}

function sortBy(type) {
    if (currentSort === type) {
        sortDescending = !sortDescending;
    } else {
        currentSort = type;
        sortDescending = (type === "players");
    }

    currentPage = 1;
    expandedServerId = null;
    updateSortUI();
    updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
    renderServers();
}

function sortServers(a, b) {
    let result = 0;
    switch (currentSort) {
        case "players":
            result = a.players.current - b.players.current;
            break;
        case "country":
            result = (a.location.countryName || a.location.countryCode || "")
                .localeCompare(b.location.countryName || b.location.countryCode || "");
            break;
        case "server":
            result = stripCodColors(a.name).localeCompare(stripCodColors(b.name));
            break;
        case "game":
            result = a.game.id.localeCompare(b.game.id);
            break;
        case "map":
            result = a.map.display.localeCompare(b.map.display);
            break;
        case "mode":
            result = a.mode.display.localeCompare(b.mode.display);
            break;
        case "ping":
            result = getPing(a) - getPing(b);
            break;
    }
    return sortDescending ? -result : result;
}

/* =====================================================
   SEARCH & TOGGLE
===================================================== */
function updateSearchResultsBanner(filteredServers) {
    const banner = document.getElementById("searchResultsBanner");
    const textEl = document.getElementById("searchResultsText");
    if (!banner || !textEl) return;

    if (searchQuery && searchQuery.trim()) {
        const totalServers = filteredServers.length;
        const totalPlayers = filteredServers.reduce((sum, s) => sum + Number(s.players.current || 0), 0);
        textEl.textContent = `${totalServers} servers and ${totalPlayers} players match "${searchQuery.trim()}"`;
        banner.style.display = "flex";
    } else {
        banner.style.display = "none";
    }
}

function searchServers() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    searchQuery = input.value.trim();
    currentPage = 1;
    expandedServerId = null;
    updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
    renderServers();
    scrollToTop();
}

function clearSearch() {
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    searchQuery = "";
    currentPage = 1;
    expandedServerId = null;
    updateRouteUrl(selectedClient, selectedGame, currentPage, searchQuery, true);
    renderServers();
    scrollToTop();
}

function toggleTopSearch() {
    const searchBar = document.getElementById("topSearchBar");
    const searchBtn = document.getElementById("topSearchBtn");
    const input = document.getElementById("searchInput");

    if (!searchBar) return;

    const isVisible = searchBar.style.display !== "none";
    if (isVisible) {
        searchBar.style.display = "none";
        searchBtn?.classList.remove("active");
    } else {
        searchBar.style.display = "flex";
        searchBtn?.classList.add("active");
        input?.focus();
    }
}

function toggleServer(id) {
    expandedServerId = (expandedServerId === id) ? null : id;
    renderServers();
}

/* =====================================================
   FLAGS & COPY CONNECT
===================================================== */
function countryCodeToEmoji(code) {
    const normalized = String(code || "").trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(normalized)) return "🌐";

    return String.fromCodePoint(
        ...normalized.split("").map(letter => 127397 + letter.charCodeAt(0))
    );
}

function getCountryFlag(code, countryName) {
    const normalized = String(code || "").trim().toUpperCase();
    const label = escapeHtml(countryName || normalized || "Unknown Country");
    const emoji = countryCodeToEmoji(normalized);

    if (!/^[A-Z]{2}$/.test(normalized)) {
        return `<span class="flag-placeholder" title="${label}" aria-label="${label}">${emoji}</span>`;
    }

    const lower = normalized.toLowerCase();

    return `
        <span class="flag-wrap" title="${label}" aria-label="${label}">
            <img
                src="https://flagcdn.com/w40/${lower}.png"
                class="country-flag"
                loading="lazy"
                alt="${label}"
            >
        </span>
    `;
}

function copyConnect(event, button) {
    event.stopPropagation();
    const address = button?.dataset?.copyAddress || "";
    const text = "connect " + address;

    const showCopySuccess = () => {
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/></svg>';
        button.style.opacity = "1";

        const container = button.closest(".copy-container");
        const toast = container ? container.querySelector(".copy-toast") : null;
        if (toast) {
            toast.classList.add("show");
            setTimeout(() => {
                toast.classList.remove("show");
            }, 2000);
        }

        setTimeout(() => {
            button.innerHTML = '⧉';
            button.style.opacity = "";
        }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopySuccess).catch(() => {
            fallbackCopyText(text);
            showCopySuccess();
        });
    } else {
        fallbackCopyText(text);
        showCopySuccess();
    }
}

function fallbackCopyText(text) {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    } catch (e) {
        console.warn("Clipboard fallback failed:", e);
    }
}

/* =====================================================
   DARK MODE
===================================================== */
const SUN_ICON_SVG = `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const MOON_ICON_SVG = `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const dark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", dark ? "yes" : "no");
    const btn = document.getElementById("darkButton");
    if (btn) btn.innerHTML = dark ? SUN_ICON_SVG : MOON_ICON_SVG;
}

function loadDarkMode() {
    const saved = localStorage.getItem("darkMode");
    const dark = (saved === null || saved === "yes");

    document.body.classList.toggle("dark-mode", dark);
    const btn = document.getElementById("darkButton");
    if (btn) btn.innerHTML = dark ? SUN_ICON_SVG : MOON_ICON_SVG;
    document.documentElement.classList.remove("dark-preload");
}

function bindEvents() {
    document.getElementById("darkButton")?.addEventListener("click", toggleDarkMode);
    document.getElementById("topSearchBtn")?.addEventListener("click", toggleTopSearch);
    document.getElementById("searchButton")?.addEventListener("click", searchServers);
    document.getElementById("bannerClearBtn")?.addEventListener("click", clearSearch);

    let searchDebounceTimeout = null;
    document.getElementById("searchInput")?.addEventListener("input", () => {
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            searchServers();
        }, 250);
    });
    document.getElementById("searchInput")?.addEventListener("keydown", event => {
        if (event.key === "Enter") searchServers();
    });

    document.getElementById("topFavBtn")?.addEventListener("click", () => {
        isFavOnly = !isFavOnly;
        updateFavoritesUI();
        currentPage = 1;
        renderServers();
    });

    document.getElementById("sortButtons")?.addEventListener("click", (e) => {
        const btn = e.target.closest(".sort-pill");
        if (btn && btn.dataset.sort) {
            sortBy(btn.dataset.sort);
        }
    });

    document.getElementById("servers")?.addEventListener("click", event => {
        const favBtn = event.target.closest(".fav-button");
        if (favBtn) {
            const id = favBtn.dataset.favId;
            if (id) toggleFavorite(id, event);
            return;
        }

        const button = event.target.closest(".copy-button");
        if (!button) return;
        copyConnect(event, button);
    });
}

bindEvents();
loadDarkMode();
loadServers();
setInterval(loadServers, 30000);
