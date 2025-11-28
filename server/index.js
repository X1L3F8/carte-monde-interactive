// Simple backend pour la recherche d'articles (NewsAPI) et le résumé IA (Google Gemini)
// IMPORTANT : ne jamais commiter vos clés API. Configurez-les via les variables d'environnement :
//   - NEWSAPI_API_KEY
//   - GOOGLE_GENAI_API_KEY

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const NEWS_API_KEY = process.env.NEWSAPI_API_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

if (!NEWS_API_KEY) {
  console.warn("[server] NEWSAPI_API_KEY n'est pas défini (les recherches d'articles échoueront)");
}

if (!GEMINI_API_KEY) {
  console.warn("[server] GOOGLE_GENAI_API_KEY n'est pas défini (les résumés IA échoueront)");
}

// Utilise l'API NewsAPI /v2/everything pour récupérer des articles récents
async function fetchNews({ sinceISO, languages, keywords, pageSize = 50 }) {
  if (!NEWS_API_KEY) return [];

  const q = keywords && keywords.length > 0 ? keywords.join(" OR ") : "";
  const now = new Date();
  const from = sinceISO || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const allArticles = [];

  for (const lang of languages || ["fr", "en"]) {
    const url = new URL("https://newsapi.org/v2/everything");
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("language", lang);
    url.searchParams.set("from", from);
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(pageSize));

    const res = await fetch(url.toString(), {
      headers: { "X-Api-Key": NEWS_API_KEY },
    });
    if (!res.ok) {
      console.error("[news] Erreur NewsAPI", await res.text());
      continue;
    }
    const data = await res.json();
    if (Array.isArray(data.articles)) {
      for (const art of data.articles) {
        allArticles.push({
          id: art.url || art.title,
          title: art.title,
          description: art.description,
          content: art.content,
          url: art.url,
          publishedAt: art.publishedAt,
          source: art.source?.name,
          language: lang,
        });
      }
    }
  }

  return allArticles;
}

// Appel à Gemini 1.5 Flash pour produire un résumé en français et extraire les pays concernés
async function summarizeWithGemini({ article, existingSummary }) {
  if (!GEMINI_API_KEY) {
    // Fallback sans IA : on renvoie juste la description ou le titre
    return {
      summary:
        existingSummary ||
        article.description ||
        article.title ||
        "Résumé non disponible (clé IA manquante)",
      countries: [],
    };
  }

  const prompt = `Tu es un assistant qui résume des articles d'actualité en français.\n\nArticle :\nTitre : ${
    article.title || "(sans titre)"
  }\nDescription : ${article.description || "(aucune)"}\nContenu brut : ${
    article.content || "(aucun contenu)"
  }\n\nRésumé existant (peut être vide) : ${
    existingSummary || "(aucun)"
  }\n\nTâche :\n1. Si le nouveau texte décrit le même événement que le résumé existant, fusionne les informations et produis un nouveau résumé unique.\n2. Sinon, produis simplement un résumé du nouvel article.\n3. Identifie les pays directement concernés par l'article et renvoie leurs codes ISO3.\n\nRéponds STRICTEMENT en JSON avec la forme :\n{\n  "sameEvent": true|false,\n  "summary": "texte du résumé en français",\n  "countries": ["FRA", "USA", ...]\n}`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    console.error("[gemini] Erreur", txt);
    return {
      sameEvent: false,
      summary:
        existingSummary ||
        article.description ||
        article.title ||
        "Résumé non disponible (erreur IA)",
      countries: [],
    };
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") ||
    "";

  try {
    const parsed = JSON.parse(text);
    return {
      sameEvent: !!parsed.sameEvent,
      summary: String(parsed.summary || "Résumé indisponible"),
      countries: Array.isArray(parsed.countries) ? parsed.countries : [],
    };
  } catch (e) {
    console.warn("[gemini] JSON invalide, texte brut utilisé", text);
    return {
      sameEvent: false,
      summary: text || existingSummary || "Résumé indisponible",
      countries: [],
    };
  }
}

// Endpoint principal : recherche les articles récents et renvoie des résumés
// Requête : {
//   since: string ISO (optionnel),
//   languages: string[],
//   keywords: string[],
//   maxResults: number,
//   existingArticles: { [id]: { summary: string } } // pour fusionner les événements
// }
app.post("/api/news/search-and-summarize", async (req, res) => {
  try {
    const {
      since,
      languages = ["fr", "en"],
      keywords = ["politique", "économique"],
      maxResults = 40,
      existingArticles = {},
    } = req.body || {};

    const articles = await fetchNews({
      sinceISO: since,
      languages,
      keywords,
      pageSize: maxResults,
    });

    // Déduplication naïve par URL/titre pour ne pas renvoyer 100x le même article brut
    const byId = new Map();
    for (const a of articles) {
      if (!a.id) continue;
      if (!byId.has(a.id)) byId.set(a.id, a);
    }

    const uniqueArticles = Array.from(byId.values());

    const results = [];
    for (const article of uniqueArticles) {
      const existing = existingArticles[article.id];
      const sum = await summarizeWithGemini({
        article,
        existingSummary: existing?.summary,
      });

      results.push({
        id: article.id,
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source,
        language: article.language,
        summary: sum.summary,
        countries: sum.countries || [],
        sameEvent: sum.sameEvent,
      });
    }

    res.json({ articles: results });
  } catch (err) {
    console.error("/api/news/search-and-summarize error", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

let server = null;

app.post("/api/shutdown", (req, res) => {
  console.log("[server] Arrêt demandé par le client");
  res.json({ ok: true });
  if (server) {
    setTimeout(() => {
      server.close(() => {
        console.log("[server] Arrêt complet");
        process.exit(0);
      });
    }, 100);
  }
});

server = app.listen(PORT, () => {
  console.log(`[server] API de nouvelles/IA en écoute sur http://localhost:${PORT}`);
});
