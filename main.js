// URL d'un GeoJSON monde avec les frontières des pays
const GEOJSON_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// Quelques données de démonstration pour certains pays (valeurs approximatives)
const COUNTRY_STATS = {
  FRA: {
    name: "France",
    description:
      "Pays d'Europe occidentale, membre de l'Union européenne, avec une forte diversité culturelle et géographique.",
    capital: "Paris",
    population: "67 M d'habitants (≈ 2023)",
    gdp: "PIB ≈ 2,8 T$ (nominal)",
    area: "551 695 km²",
  },
  USA: {
    name: "États-Unis",
    description:
      "Fédération de 50 États en Amérique du Nord, l'une des plus grandes économies du monde.",
    capital: "Washington, D.C.",
    population: "333 M d'habitants (≈ 2023)",
    gdp: "PIB ≈ 27 T$ (nominal)",
    area: "9 834 000 km²",
  },
  CAN: {
    name: "Canada",
    description:
      "Grand pays nord-américain, connu pour ses vastes espaces naturels et sa diversité culturelle.",
    capital: "Ottawa",
    population: "40 M d'habitants (≈ 2023)",
    gdp: "PIB ≈ 2 T$ (nominal)",
    area: "9 985 000 km²",
  },
  BRA: {
    name: "Brésil",
    description:
      "Plus grand pays d'Amérique du Sud, abritant une grande partie de l'Amazonie.",
    capital: "Brasília",
    population: "203 M d'habitants (≈ 2023)",
    gdp: "PIB ≈ 2,1 T$ (nominal)",
    area: "8 516 000 km²",
  },
  DEU: {
    name: "Allemagne",
    description:
      "Puissance économique majeure de l'Europe, située au cœur du continent.",
    capital: "Berlin",
    population: "84 M d'habitants (≈ 2023)",
    gdp: "PIB ≈ 4,5 T$ (nominal)",
    area: "357 000 km²",
  },
  CHN: {
    name: "Chine",
    description:
      "Pays le plus peuplé du monde, grande puissance industrielle et technologique.",
    capital: "Pékin",
    population: "1,41 Md d'habitants (≈ 2023)",
    gdp: "PIB ≈ 18 T$ (nominal)",
    area: "9 597 000 km²",
  },
  IND: {
    name: "Inde",
    description:
      "Grande démocratie d'Asie du Sud, très peuplée et en forte croissance économique.",
    capital: "New Delhi",
    population: "1,42 Md d'habitants (≈ 2023)",
    gdp: "PIB ≈ 3,7 T$ (nominal)",
    area: "3 287 000 km²",
  },
  JPN: {
    name: "Japon",
    description:
      "Archipel d'Asie de l'Est, connu pour sa technologie avancée et sa culture unique.",
    capital: "Tokyo",
    population: "124 M d'habitants (≈ 2023)",
    gdp: "PIB ≈ 4,2 T$ (nominal)",
    area: "377 975 km²",
  },
};

// Récupération des éléments du panneau
const panel = document.getElementById("country-panel");
const closePanelBtn = document.getElementById("close-panel");
const countryNameEl = document.getElementById("country-name");
const countryDescriptionEl = document.getElementById("country-description");
const countryStatsEl = document.getElementById("country-stats");

// Initialisation de la carte Leaflet
const map = L.map("map", {
  worldCopyJump: true,
}).setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
  maxZoom: 5,
  minZoom: 2,
}).addTo(map);

let geojsonLayer;

function getCountryCode(feature) {
  const props = feature.properties || {};
  return (
    (feature.id || props.iso_a3 || props.ISO_A3 || props.ISO3 || "").toUpperCase()
  );
}

function buildCountryInfo(feature) {
  const props = feature.properties || {};
  const code = getCountryCode(feature);
  const custom = COUNTRY_STATS[code];

  const name = custom?.name || props.name || props.ADMIN || "Pays inconnu";

  const description =
    custom?.description ||
    "Nous n'avons pas encore de description détaillée pour ce pays, mais vous pouvez déjà l'explorer sur la carte.";

  const stats = [];

  if (custom?.capital) stats.push(["Capitale", custom.capital]);
  if (custom?.population) stats.push(["Population", custom.population]);
  if (custom?.gdp) stats.push(["PIB", custom.gdp]);
  if (custom?.area) stats.push(["Superficie", custom.area]);

  return { name, description, stats };
}

function renderPanel(feature) {
  const { name, description, stats } = buildCountryInfo(feature);

  countryNameEl.textContent = name;
  countryDescriptionEl.textContent = description;

  countryStatsEl.innerHTML = "";

  if (stats.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Aucune statistique n'est encore disponible pour ce pays.";
    countryStatsEl.appendChild(li);
  } else {
    for (const [label, value] of stats) {
      const li = document.createElement("li");

      const labelSpan = document.createElement("span");
      labelSpan.className = "label";
      labelSpan.textContent = label;

      const valueSpan = document.createElement("span");
      valueSpan.className = "value";
      valueSpan.textContent = value;

      li.appendChild(labelSpan);
      li.appendChild(valueSpan);
      countryStatsEl.appendChild(li);
    }
  }

  panel.classList.add("open");
}

function closePanel() {
  panel.classList.remove("open");
}

closePanelBtn.addEventListener("click", closePanel);

// Fermer le panneau avec la touche Échap
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePanel();
  }
});

// Style par défaut et survol pour les pays
const defaultStyle = {
  weight: 1,
  color: "#1e293b",
  fillColor: "#0ea5e9",
  fillOpacity: 0.35,
};

const highlightStyle = {
  weight: 2,
  color: "#facc15",
  fillColor: "#22d3ee",
  fillOpacity: 0.6,
};

function onEachCountry(feature, layer) {
  layer.on({
    mouseover: (e) => {
      const target = e.target;
      target.setStyle(highlightStyle);
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        target.bringToFront();
      }
    },
    mouseout: (e) => {
      geojsonLayer.resetStyle(e.target);
    },
    click: () => {
      renderPanel(feature);
    },
  });
}

fetch(GEOJSON_URL)
  .then((res) => res.json())
  .then((data) => {
    geojsonLayer = L.geoJSON(data, {
      style: defaultStyle,
      onEachFeature: onEachCountry,
    }).addTo(map);
  })
  .catch((err) => {
    console.error("Erreur lors du chargement du GeoJSON :", err);
    countryNameEl.textContent = "Erreur de chargement";
    countryDescriptionEl.textContent =
      "Impossible de charger la carte des pays. Vérifiez votre connexion Internet et rechargez la page.";
  });
