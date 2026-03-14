import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LIMITS = {
  headline: 30,
  description: 90,
  metaTitle: 60,
  metaDescription: 160,
};

type AIResult = {
  headlines: string[];
  descriptions: string[];
  metaTitle: string;
  metaDescription: string;
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueByNormalized(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const cleaned = item.trim();
    if (!cleaned) continue;

    const normalized = normalizeText(cleaned);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    result.push(cleaned);
  }

  return result;
}

function trimToLimit(text: string, limit: number) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= limit) return clean;

  const sliced = clean.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(" ");

  if (lastSpace > 10) {
    return sliced.slice(0, lastSpace).trim();
  }

  return sliced.trim();
}

function filterByLimit(items: string[], limit: number) {
  return uniqueByNormalized(
    items
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter((item) => item.length > 0 && item.length <= limit)
  );
}

function extractJSONString(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Nepavyko rasti JSON modelio atsakyme.");
  }

  return match[0];
}

function parseAIResult(text: string): AIResult {
  const jsonString = extractJSONString(text);
  const parsed = JSON.parse(jsonString);

  return {
    headlines: Array.isArray(parsed.headlines) ? parsed.headlines : [],
    descriptions: Array.isArray(parsed.descriptions) ? parsed.descriptions : [],
    metaTitle:
      typeof parsed.metaTitle === "string" ? parsed.metaTitle.trim() : "",
    metaDescription:
      typeof parsed.metaDescription === "string"
        ? parsed.metaDescription.trim()
        : "",
  };
}

function buildCategoryGuidance(
  mainCategory?: string,
  subCategory?: string,
  customType?: string
) {
  const joined =
    `${mainCategory || ""} ${subCategory || ""} ${customType || ""}`.toLowerCase();

  if (
    joined.includes("kardio") ||
    joined.includes("bėgimo") ||
    joined.includes("walking pad") ||
    joined.includes("elips") ||
    joined.includes("dvira") ||
    joined.includes("irkl") ||
    joined.includes("step") ||
    joined.includes("air bike")
  ) {
    return `
Kategorijos akcentai:
- Akcentuok judėjimą namuose, kardio naudą, patogumą ir reguliarų naudojimą.
- Tinka kampai: tylus veikimas, kompaktiškumas, sulankstymas, taupo vietą, patogu namams.
- Headline'ai turi skambėti kaip realūs pirkimo intent variantai.
- Nevartok per daug bendrų frazių kaip "sportuok geriau".`;
  }

  if (
    joined.includes("jėgos") ||
    joined.includes("smith") ||
    joined.includes("rack") ||
    joined.includes("press") ||
    joined.includes("lat pulldown") ||
    joined.includes("functional trainer") ||
    joined.includes("cable") ||
    joined.includes("leg press")
  ) {
    return `
Kategorijos akcentai:
- Akcentuok stabilumą, funkcionalumą, apkrovą, raumenų grupes ir treniruočių įvairovę.
- Tinka kampai: daugiafunkcis, tvirtas rėmas, reguliuojamas, namų sporto salė, profesionalus jausmas.
- Venk kardio kalbos.
- Tekstai turi jaustis labiau equipment-focused.`;
  }

  if (
    joined.includes("hantel") ||
    joined.includes("štang") ||
    joined.includes("kettlebell") ||
    joined.includes("svor")
  ) {
    return `
Kategorijos akcentai:
- Akcentuok universalumą, progresyvų krūvį, patvarumą ir namų treniruotes.
- Tinka kampai: reguliuojamas, patvarus, kompaktiškas, įvairiems pratimams.
- Headline'ai turi būti konkretūs ir trumpi.`;
  }

  if (
    joined.includes("funkcin") ||
    joined.includes("trx") ||
    joined.includes("battle rope") ||
    joined.includes("plyo") ||
    joined.includes("sled")
  ) {
    return `
Kategorijos akcentai:
- Akcentuok viso kūno treniruotes, mobilumą, sprogstamą jėgą, koordinaciją.
- Tinka kampai: funkciniam pasirengimui, intensyvioms treniruotėms, universaliam naudojimui.
- Venk per daug bendrų kardio ar jėgos klišių.`;
  }

  if (
    joined.includes("reabil") ||
    joined.includes("mobil") ||
    joined.includes("mini bike") ||
    joined.includes("tempim")
  ) {
    return `
Kategorijos akcentai:
- Akcentuok saugumą, mažą apkrovą, komfortą ir lengvą naudojimą.
- Tinka kampai: švelniam judėjimui, kasdieniam naudojimui, patogu namuose.
- Venk agresyvios pardaviminės kalbos.`;
  }

  if (
    joined.includes("bokso") ||
    joined.includes("kovos") ||
    joined.includes("kriauš") ||
    joined.includes("maiš")
  ) {
    return `
Kategorijos akcentai:
- Akcentuok patvarumą, smūgių sugėrimą, stabilumą, intensyvias treniruotes.
- Tinka kampai: bokso treniruotėms, ištvermei, technikai, namams ar salei.
- Tekstai turi būti energingi, bet trumpi.`;
  }

  if (joined.includes("lauko") || joined.includes("street workout")) {
    return `
Kategorijos akcentai:
- Akcentuok atsparumą, ilgaamžiškumą, naudojimą lauke ir tvirtą konstrukciją.
- Tinka kampai: atsparus aplinkai, tvirta konstrukcija, viešoms ar privačioms erdvėms.
- Venk namų interjero kalbos.`;
  }

  return `
Kategorijos akcentai:
- Akcentuok realią produkto naudą, konkretumą ir pirkimo intenciją.
- Naudok trumpas, aiškias frazes.
- Venk bendrų ir tuščių reklaminių klišių.`;
}

function buildBrandStyleGuidance(brandStyle?: string) {
  switch (brandStyle) {
    case "premium":
      return `
Brand style:
- Skambėk premium, švariai, solidžiai.
- Venk pigių akcijinių klišių.
- Naudok kokybės, komforto, elegancijos kampus.
- Tekstai turi jaustis labiau "aukštesnės klasės".`;

    case "sales":
      return `
Brand style:
- Skambėk aiškiai pardavimiškai.
- Naudok stiprią pirkimo intenciją, naudos akcentus, sprendimo logiką.
- Gali būti daugiau skatinančio tono, bet be spam.
- Venk per ilgo teatrališkumo.`;

    case "performance":
      return `
Brand style:
- Akcentuok rezultatą, efektyvumą, progresą, treniruotės naudą.
- Tinka kampai: ištvermė, jėga, intensyvumas, rezultatai, našumas.
- Tekstai turi būti energingi ir orientuoti į veiksmą.`;

    case "neutral":
      return `
Brand style:
- Skambėk neutraliai, aiškiai, informatyviai.
- Mažiau emocijos, daugiau konkretumo.
- Venk premium ar akcijinių perdėjimų.`;

    default:
      return `
Brand style:
- Laikykis aiškaus, tvarkingo, komerciškai naudingo tono.`;
  }
}

function buildOutputModeGuidance(outputMode?: string) {
  switch (outputMode) {
    case "google_ads":
      return `
Output mode:
- Prioritetas: usable Google Ads assetai.
- Headlines turi būti trumpi, stiprūs, pirkimo intencijos.
- Descriptions turi būti aiškios, greitai skanuojamos, su naudos kampu.
- Gali būti daugiau komercinio spaudimo, bet be spam.`;

    case "seo":
      return `
Output mode:
- Prioritetas: natūralumas, raktažodžių logika, organinis skambesys.
- Headlines vis tiek turi tilpti į limitus, bet gali būti kiek labiau keyword-rich.
- Meta title ir meta description turi būti ypač natūralūs ir naudingi SEO.
- Venk clickbait stiliaus.`;

    case "universal":
      return `
Output mode:
- Prioritetas: balansas tarp reklaminių ir SEO tekstų.
- Tekstai turi būti universalūs, aiškūs, tinkami tiek ads, tiek puslapio panaudojimui.
- Venk per agresyvaus pardaviminio spaudimo.`;

    default:
      return `
Output mode:
- Kurk subalansuotus, praktiškai naudojamus tekstus.`;
  }
}

function buildMainPrompt(input: {
  productName: string;
  mainCategory?: string;
  subCategory?: string;
  customType?: string;
  category: string;
  description: string;
  usp: string;
  keywords: string;
  tone: string;
  language: string;
  brandStyle?: string;
  outputMode?: string;
}) {
  const categoryGuidance = buildCategoryGuidance(
    input.mainCategory,
    input.subCategory,
    input.customType
  );

  const brandGuidance = buildBrandStyleGuidance(input.brandStyle);
  const outputGuidance = buildOutputModeGuidance(input.outputMode);

  return `
Tu esi labai stiprus e. komercijos copywriteris, kuris kuria tekstus treniruoklių ir sporto įrangos el. parduotuvei.

Sugeneruok TIK JSON formatu:
{
  "headlines": ["..."],
  "descriptions": ["..."],
  "metaTitle": "...",
  "metaDescription": "..."
}

Pagrindinės taisyklės:
- Kalba: ${input.language === "lt" ? "lietuvių" : "anglų"}
- Tonas: ${input.tone}
- Brand style: ${input.brandStyle || "neutral"}
- Output mode: ${input.outputMode || "google_ads"}
- Niša: treniruokliai ir sporto įranga
- Headlines: lygiai 15 variantų
- Descriptions: lygiai 4 variantai
- MetaTitle: 1 variantas
- MetaDescription: 1 variantas
- Jokio papildomo paaiškinimo, tik JSON
- Venk pasikartojimų
- Naudok pirkimo intenciją
- Tekstai turi būti usable, ne tiesiog "gražūs"

GRIEŽTI limitai:
- Kiekvienas headline PRIVALO būti iki ${LIMITS.headline} simbolių
- Kiekvienas description PRIVALO būti iki ${LIMITS.description} simbolių
- Meta title PRIVALO būti iki ${LIMITS.metaTitle} simbolių
- Meta description PRIVALO būti iki ${LIMITS.metaDescription} simbolių

Labai svarbu:
- Headlines turi būti trumpi, konkretūs, dažniausiai 2-5 žodžių.
- Stenkis taikyti į 18-29 simbolių zoną headlines.
- Descriptions taikyk į 55-85 simbolių zoną.
- Venk ilgų sakinių ir bereikalingų būdvardžių.
- Nerašyk bereikalingų brūkšnių, jei dėl jų tekstas ilgėja.
- Nenaudok beveik vienodų pradžių visiems variantams.

Kategorijų kontekstas:
- Pagrindinė kategorija: ${input.mainCategory || ""}
- Subkategorija: ${input.subCategory || ""}
- Custom produkto tipas: ${input.customType || ""}
- Galutinė kategorija: ${input.category}

${categoryGuidance}

${brandGuidance}

${outputGuidance}

Produkto duomenys:
Produkto pavadinimas: ${input.productName}
Aprašymas: ${input.description}
USP: ${input.usp}
Raktažodžiai: ${input.keywords}
`;
}

function buildRetryPrompt(input: {
  productName: string;
  mainCategory?: string;
  subCategory?: string;
  customType?: string;
  category: string;
  description: string;
  usp: string;
  keywords: string;
  tone: string;
  language: string;
  brandStyle?: string;
  outputMode?: string;
  missingHeadlines: number;
  missingDescriptions: number;
  existingHeadlines: string[];
  existingDescriptions: string[];
}) {
  const categoryGuidance = buildCategoryGuidance(
    input.mainCategory,
    input.subCategory,
    input.customType
  );

  const brandGuidance = buildBrandStyleGuidance(input.brandStyle);
  const outputGuidance = buildOutputModeGuidance(input.outputMode);

  return `
Tu pataisai ankstesnę generaciją ir turi sugeneruoti tik trūkstamus usable variantus.

Sugeneruok TIK JSON formatu:
{
  "headlines": ["..."],
  "descriptions": ["..."]
}

Taisyklės:
- Kalba: ${input.language === "lt" ? "lietuvių" : "anglų"}
- Tonas: ${input.tone}
- Brand style: ${input.brandStyle || "neutral"}
- Output mode: ${input.outputMode || "google_ads"}
- Headlines kiekis: ${input.missingHeadlines}
- Descriptions kiekis: ${input.missingDescriptions}
- Jokio papildomo teksto, tik JSON
- Jokio kartojimosi su jau turimais variantais

GRIEŽTI limitai:
- Kiekvienas headline PRIVALO būti iki ${LIMITS.headline} simbolių
- Kiekvienas description PRIVALO būti iki ${LIMITS.description} simbolių

Labai svarbu:
- Headlines turi būti labai trumpi ir konkretūs
- Descriptions turi būti aiškūs ir usable
- Jei variantas per ilgas, jo nerašyk
- Geriau trumpesnis ir stipresnis variantas

Kategorijų kontekstas:
- Pagrindinė kategorija: ${input.mainCategory || ""}
- Subkategorija: ${input.subCategory || ""}
- Custom produkto tipas: ${input.customType || ""}
- Galutinė kategorija: ${input.category}

${categoryGuidance}

${brandGuidance}

${outputGuidance}

Jau turimi headlines:
${input.existingHeadlines.map((x, i) => `${i + 1}. ${x}`).join("\n")}

Jau turimi descriptions:
${input.existingDescriptions.map((x, i) => `${i + 1}. ${x}`).join("\n")}

Produkto duomenys:
Produkto pavadinimas: ${input.productName}
Aprašymas: ${input.description}
USP: ${input.usp}
Raktažodžiai: ${input.keywords}
`;
}

async function askOpenAI(prompt: string) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = response.output_text?.trim();

  if (!text) {
    throw new Error("Modelis negrąžino teksto.");
  }

  return text;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      productName,
      mainCategory,
      subCategory,
      customType,
      category,
      description,
      usp,
      keywords,
      tone,
      language,
      brandStyle,
      outputMode,
    } = body;

    if (!productName || !category || !description) {
      return Response.json(
        { error: "Trūksta privalomų laukų." },
        { status: 400 }
      );
    }

    const mainPrompt = buildMainPrompt({
      productName,
      mainCategory,
      subCategory,
      customType,
      category,
      description,
      usp,
      keywords,
      tone,
      language,
      brandStyle,
      outputMode,
    });

    const firstText = await askOpenAI(mainPrompt);
    const firstParsed = parseAIResult(firstText);

    let headlines = filterByLimit(firstParsed.headlines, LIMITS.headline);
    let descriptions = filterByLimit(
      firstParsed.descriptions,
      LIMITS.description
    );

    let metaTitle = trimToLimit(firstParsed.metaTitle, LIMITS.metaTitle);
    let metaDescription = trimToLimit(
      firstParsed.metaDescription,
      LIMITS.metaDescription
    );

    for (let attempt = 0; attempt < 2; attempt++) {
      const missingHeadlines = Math.max(0, 15 - headlines.length);
      const missingDescriptions = Math.max(0, 4 - descriptions.length);

      if (missingHeadlines === 0 && missingDescriptions === 0) {
        break;
      }

      const retryPrompt = buildRetryPrompt({
        productName,
        mainCategory,
        subCategory,
        customType,
        category,
        description,
        usp,
        keywords,
        tone,
        language,
        brandStyle,
        outputMode,
        missingHeadlines,
        missingDescriptions,
        existingHeadlines: headlines,
        existingDescriptions: descriptions,
      });

      const retryText = await askOpenAI(retryPrompt);
      const retryParsed = parseAIResult(retryText);

      headlines = filterByLimit(
        [...headlines, ...(retryParsed.headlines || [])],
        LIMITS.headline
      ).slice(0, 15);

      descriptions = filterByLimit(
        [...descriptions, ...(retryParsed.descriptions || [])],
        LIMITS.description
      ).slice(0, 4);
    }

    return Response.json({
      headlines: headlines.slice(0, 15),
      descriptions: descriptions.slice(0, 4),
      metaTitle,
      metaDescription,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Įvyko serverio klaida generuojant tekstą.";

    return Response.json({ error: message }, { status: 500 });
  }
}
