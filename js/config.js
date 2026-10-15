const CLIENT_CONFIG = {
  "IW4x": { name: "IW4x", color: "#38bdf8", games: ["IW4"] },
  "Plutonium": { name: "Plutonium", color: "#f97316", games: ["IW5", "T4", "T4ZM", "T5", "T5ZM", "T6", "T6ZM"] },
  "AlterWare": { name: "AlterWare", color: "#a855f7", games: ["IW6", "T7", "SHG1"] },
  "Aurora": { name: "Aurora", color: "#ec4899", games: ["H1", "IW7"] },
  "HorizonMW": { name: "HorizonMW", color: "#2dd4bf", games: ["H2M"] },
  "S2x": { name: "S2x", color: "#f4c95d", games: ["S2"] },
  "CoD4x": { name: "CoD4x", color: "#22c55e", games: ["IW3"] },
  "CoD1": { name: "CoD1", color: "#a1a1aa", games: ["COD"] },
  "CoD2": { name: "CoD2", color: "#a1a1aa", games: ["COD2"] },
  "CoDUO": { name: "CoDUO", color: "#a1a1aa", games: ["CODUO"] }
};

const GAME_ORDER = ["IW5","T4","T4ZM","T5","T5ZM","T6","T6ZM","IW4","IW6","T7","H2M","IW3","SHG1","H1","IW7","S2","COD","COD2","CODUO"];
const ITEMS_PER_PAGE = 25;

window.APP_CONFIG = {
  api: {
    servers: "https://gameserve.rs/api/v1/servers?limit=200&offset=0"
  },
  refreshMs: 20000
};
