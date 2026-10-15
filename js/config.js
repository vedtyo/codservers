const GAME_SLUGS = {
    "T6": "BO2-MP",
    "T6ZM": "BO2-ZM",
    "IW5": "MW3",
    "IW4": "MW2",
    "IW3": "CoD4",
    "IW6": "Ghosts",
    "H2M": "MW2R",
    "T7": "BO3",
    "T5": "BO1-MP",
    "T5ZM": "BO1-ZM",
    "T4": "WaW-MP",
    "T4ZM": "WaW-ZM",
    "IW7": "IW7",
    "H1": "MWR",
    "S2": "WWII",
    "SHG1": "AW",
    "COD": "CoD1",
    "COD2": "CoD2",
    "CODUO": "CoDUO"
};

const SHORT_GAME_NAMES = {
    T6: "BO2 MP",
    T6ZM: "BO2 ZM",
    IW5: "MW3",
    IW4: "MW2",
    IW3: "CoD4",
    IW6: "Ghosts",
    H2M: "MW2R",
    T7: "BO3",
    T5: "BO1 MP",
    T5ZM: "BO1 ZM",
    T4: "WaW MP",
    T4ZM: "WaW ZM",
    IW7: "IW7",
    H1: "MWR",
    S2: "WWII",
    SHG1: "AW",
    COD: "CoD1",
    COD2: "CoD2",
    CODUO: "CoDUO"
};

const FULL_GAME_NAMES = {
    T6: "Black Ops II",
    T6ZM: "Black Ops II Zombies",
    IW5: "Modern Warfare 3",
    IW4: "Modern Warfare 2",
    IW3: "Call of Duty 4",
    IW6: "Ghosts",
    H2M: "MW2 Campaign Remastered",
    T7: "Black Ops III",
    T5: "Black Ops",
    T5ZM: "Black Ops Zombies",
    T4: "World at War",
    T4ZM: "World at War Zombies",
    IW7: "Infinite Warfare",
    H1: "Modern Warfare Remastered",
    S2: "Call of Duty: WWII",
    SHG1: "Advanced Warfare",
    COD: "Call of Duty (2003)",
    COD2: "Call of Duty 2",
    CODUO: "Call of Duty: United Offensive"
};

const GAME_DOT_COLORS = {
    T6: "#f97316",
    T6ZM: "#f97316",
    IW5: "#10b981",
    T5: "#ef4444",
    T5ZM: "#ef4444",
    T4: "#3b82f6",
    T4ZM: "#3b82f6",
    IW4: "#38bdf8",
    IW6: "#a855f7",
    T7: "#a855f7",
    SHG1: "#a855f7",
    H1: "#ec4899",
    IW7: "#ec4899",
    H2M: "#2dd4bf",
    IW3: "#22c55e",
    S2: "#eab308",
    COD: "#9ca3af",
    COD2: "#9ca3af",
    CODUO: "#9ca3af"
};

const CLIENT_CONFIG = {
    "IW4x": {
        name: "IW4x",
        url: "https://iw4x.io/",
        color: "#38bdf8",
        games: ["IW4"]
    },
    "Plutonium": {
        name: "Plutonium",
        url: "https://plutonium.pw/",
        color: "#f97316",
        games: ["IW5", "T4", "T4ZM", "T5", "T5ZM", "T6", "T6ZM"]
    },
    "AlterWare": {
        name: "AlterWare",
        url: "https://alterware.dev/",
        color: "#a855f7",
        games: ["IW6", "T7", "SHG1"]
    },
    "Aurora": {
        name: "Aurora",
        url: "https://auroramod.dev/",
        color: "#ec4899",
        games: ["H1", "IW7"]
    },
    "HorizonMW": {
        name: "HorizonMW",
        url: "https://horizonmw.org/",
        color: "#2dd4bf",
        games: ["H2M"]
    },
    "S2x": {
        name: "S2x",
        url: "https://discord.gg/PCZ8uPZnaS",
        color: "#eab308",
        games: ["S2"]
    },
    "CoD4x": {
        name: "CoD4x",
        url: "https://cod4x.ovh/",
        color: "#22c55e",
        games: ["IW3"]
    },
    "CoD1": {
        name: "CoD1",
        url: "https://cod.pm/",
        color: "#9ca3af",
        games: ["COD"]
    },
    "CoD2": {
        name: "CoD2",
        url: "https://cod.pm/",
        color: "#9ca3af",
        games: ["COD2"]
    },
    "CoDUO": {
        name: "CoDUO",
        url: "https://cod.pm/",
        color: "#9ca3af",
        games: ["CODUO"]
    }
};

const GAME_ORDER = [
    "IW5", "T4", "T4ZM", "T5", "T5ZM", "T6", "T6ZM",
    "IW4", "IW6", "T7", "H2M", "IW3", "SHG1", "H1", "IW7",
    "S2", "COD", "COD2", "CODUO"
];

function getClientForGame(gameId) {
    if (!gameId) return null;
    const g = String(gameId).toUpperCase();
    for (const [clientKey, clientData] of Object.entries(CLIENT_CONFIG)) {
        if (clientData.games.includes(g)) {
            return { key: clientKey, ...clientData };
        }
    }
    return {
        key: "Unknown",
        name: "Unknown Client",
        url: "#",
        color: "#8c939e",
        games: []
    };
}

const COUNTRY_NAMES = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa",
    "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AQ": "Antarctica",
    "AG": "Antigua and Barbuda", "AR": "Argentina", "AM": "Armenia", "AW": "Aruba",
    "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas",
    "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus",
    "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda",
    "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina", "BW": "Botswana",
    "BR": "Brazil", "IO": "British Indian Ocean Territory", "VG": "British Virgin Islands",
    "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi",
    "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "CV": "Cape Verde",
    "KY": "Cayman Islands", "CF": "Central African Republic", "TD": "Chad",
    "CL": "Chile", "CN": "China", "CX": "Christmas Island", "CC": "Cocos Islands",
    "CO": "Colombia", "KM": "Comoros", "CK": "Cook Islands", "CR": "Costa Rica",
    "HR": "Croatia", "CU": "Cuba", "CW": "Curaçao", "CY": "Cyprus",
    "CZ": "Czech Republic", "CD": "Democratic Republic of the Congo", "DK": "Denmark",
    "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "TL": "East Timor",
    "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea",
    "ER": "Eritrea", "EE": "Estonia", "SZ": "Eswatini", "ET": "Ethiopia",
    "FK": "Falkland Islands", "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland",
    "FR": "France", "GF": "French Guiana", "PF": "French Polynesia",
    "TF": "French Southern Territories", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia",
    "DE": "Germany", "GH": "Ghana", "GI": "Gibraltar", "GR": "Greece",
    "GL": "Greenland", "GD": "Grenada", "GP": "Guadeloupe", "GU": "Guam",
    "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau",
    "GY": "Guyana", "HT": "Haiti", "HN": "Honduras", "HK": "Hong Kong",
    "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia",
    "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IM": "Isle of Man",
    "IL": "Israel", "IT": "Italy", "CI": "Ivory Coast", "JM": "Jamaica",
    "JP": "Japan", "JE": "Jersey", "JO": "Jordan", "KZ": "Kazakhstan",
    "KE": "Kenya", "KI": "Kiribati", "XK": "Kosovo", "KW": "Kuwait",
    "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon",
    "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein",
    "LT": "Lithuania", "LU": "Luxembourg", "MO": "Macau", "MG": "Madagascar",
    "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali",
    "MT": "Malta", "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania",
    "MU": "Mauritius", "YT": "Mayotte", "MX": "Mexico", "FM": "Micronesia",
    "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro",
    "MS": "Montserrat", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar",
    "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands",
    "NC": "New Caledonia", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger",
    "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "KP": "North Korea",
    "MK": "North Macedonia", "MP": "Northern Mariana Islands", "NO": "Norway",
    "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PS": "Palestine",
    "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru",
    "PH": "Philippines", "PN": "Pitcairn Islands", "PL": "Poland", "PT": "Portugal",
    "PR": "Puerto Rico", "QA": "Qatar", "CG": "Republic of the Congo", "RE": "Réunion",
    "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "BL": "Saint Barthélemy",
    "SH": "Saint Helena", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia",
    "MF": "Saint Martin", "PM": "Saint Pierre and Miquelon",
    "VC": "Saint Vincent and the Grenadines", "WS": "Samoa", "SM": "San Marino",
    "ST": "São Tomé and Príncipe", "SA": "Saudi Arabia", "SN": "Senegal",
    "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore",
    "SX": "Sint Maarten", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands",
    "SO": "Somalia", "ZA": "South Africa", "GS": "South Georgia", "KR": "South Korea",
    "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan",
    "SR": "Suriname", "SJ": "Svalbard and Jan Mayen", "SE": "Sweden",
    "CH": "Switzerland", "SY": "Syria", "TW": "Taiwan", "TJ": "Tajikistan",
    "TZ": "Tanzania", "TH": "Thailand", "TG": "Togo", "TK": "Tokelau",
    "TO": "Tonga", "TT": "Trinidad and Tobago", "TN": "Tunisia", "TR": "Turkey",
    "TM": "Turkmenistan", "TC": "Turks and Caicos Islands", "TV": "Tuvalu",
    "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates",
    "GB": "United Kingdom", "US": "United States", "VI": "United States Virgin Islands",
    "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VA": "Vatican City",
    "VE": "Venezuela", "VN": "Vietnam", "WF": "Wallis and Futuna",
    "EH": "Western Sahara", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"
};

function getCountryNameByCode(code) {
    if (!code) return "";
    const uc = String(code).toUpperCase();
    return COUNTRY_NAMES[uc] || uc;
}

const FORCED_IP_COUNTRIES = {
    "100.92.24.78": "US",
    "100.92.24.79": "US",
    "100.92.6.225": "IT",
    "100.92.44.197": "IT",
    "100.92.100.197": "IT",
    "13.14.15.16": "IT",
    "2a01:4f8:221:32c5::2": "US",
    "2a01:4f8:a0:9118::2": "US",
    "2a0b:64c0:1::2d4": "US"
};

function getForcedCountryByIp(ip) {
    return FORCED_IP_COUNTRIES[String(ip || "").trim()] || "";
}

const SLUG_TO_GAME = Object.entries(GAME_SLUGS).reduce((acc, [gameId, slug]) => {
    acc[slug.toLowerCase()] = gameId;
    return acc;
}, {});

const API_ENDPOINTS = [
    "https://gameserve.rs/api/servers",
    "https://gameserve.rs/api/v1/servers"
];

const ITEMS_PER_PAGE = 50;
