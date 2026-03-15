"use client";

import { useState, FormEvent, ChangeEvent, useMemo } from "react";
import {
  equipmentOptions,
  mainCategoryLabels,
  type MainCategoryKey,
} from "@/data/equipmentOptions";

type FormData = {
  productName: string;
  mainCategory: MainCategoryKey;
  subCategory: string;
  customType: string;
  description: string;
  usp: string;
  keywords: string;
  tone: string;
  language: string;
  brandStyle: string;
  outputMode: string;
};

type GenerateResult = {
  headlines: string[];
  descriptions: string[];
  metaTitle: string;
  metaDescription: string;
};

const LIMITS = {
  headline: 30,
  description: 90,
  metaTitle: 60,
  metaDescription: 160,
};

const defaultMainCategory: MainCategoryKey = "kardio";

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    mainCategory: defaultMainCategory,
    subCategory: equipmentOptions[defaultMainCategory][0],
    customType: "",
    description: "",
    usp: "",
    keywords: "",
    tone: "sales",
    language: "lt",
    brandStyle: "premium",
    outputMode: "google_ads",
  });

  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const subCategoryOptions = useMemo(() => {
    return equipmentOptions[formData.mainCategory];
  }, [formData.mainCategory]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (name === "mainCategory") {
      const selectedMainCategory = value as MainCategoryKey;

      setFormData((prev) => ({
        ...prev,
        mainCategory: selectedMainCategory,
        subCategory: equipmentOptions[selectedMainCategory][0],
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function buildCategoryLabel() {
    const mainLabel = mainCategoryLabels[formData.mainCategory];
    const typeLabel = formData.customType.trim() || formData.subCategory;

    return `${mainLabel} | ${typeLabel}`;
  }

  async function generateTexts() {
    setLoading(true);
    setError("");
    setCopied("");

    try {
      const payload = {
        productName: formData.productName,
        mainCategory: mainCategoryLabels[formData.mainCategory],
        subCategory: formData.subCategory,
        customType: formData.customType.trim(),
        category: buildCategoryLabel(),
        description: formData.description,
        usp: formData.usp,
        keywords: formData.keywords,
        tone: formData.tone,
        language: formData.language,
        brandStyle: formData.brandStyle,
        outputMode: formData.outputMode,
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generavimas nepavyko.");
      }

      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Įvyko nežinoma klaida.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await generateTexts();
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`Nukopijuota: ${label}`);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("Nepavyko nukopijuoti");
      setTimeout(() => setCopied(""), 2000);
    }
  }

  async function copyList(label: string, items: string[]) {
    await copyText(label, items.join("\n"));
  }

  function getCountClass(length: number, limit: number) {
    return length <= limit ? "text-emerald-400" : "text-red-400";
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-block rounded-full border border-white/20 px-3 py-1 text-sm text-white/70">
            MVP v6 · brand style + output mode
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            AI Google Ads + SEO Copy Generator
          </h1>

          <p className="mt-6 max-w-2xl text-base text-white/70 md:text-lg">
            Įrankis treniruoklių ir sporto įrangos el. parduotuvėms, kuris padeda
            generuoti Google Ads headline&apos;us, descriptions ir SEO meta tekstus.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="mb-4 text-2xl font-semibold">Įvestis</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Produkto pavadinimas
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="Pvz. Sulankstomas bėgimo takelis namams"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Pagrindinė kategorija
                </label>
                <select
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                >
                  {Object.entries(mainCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Subkategorija
                </label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                >
                  {subCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Custom produkto tipas
                </label>
                <input
                  type="text"
                  name="customType"
                  value={formData.customType}
                  onChange={handleChange}
                  placeholder="Pvz. Walking pad su turėklais, air bike, smith machine"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/40"
                />
                <p className="mt-2 text-xs text-white/45">
                  Jei reikia tikslesnio tipo, įrašyk ranka. Jei paliksi tuščią,
                  bus naudojama subkategorija.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 text-sm text-white/50">
                  Galutinė kategorija AI modeliui
                </p>
                <p className="text-sm text-white/90">{buildCategoryLabel()}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Produkto aprašymas
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Trumpai aprašyk produktą"
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Unikalus privalumas
                </label>
                <input
                  type="text"
                  name="usp"
                  value={formData.usp}
                  onChange={handleChange}
                  placeholder="Pvz. Sulankstomas, tylus, taupo vietą"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Raktažodžiai
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="Pvz. bėgimo takelis, walking pad, kardio treniruoklis namams"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/40"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Tonas</label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  >
                    <option value="professional">Profesionalus</option>
                    <option value="premium">Premium</option>
                    <option value="sales">Pardaviminis</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Kalba</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  >
                    <option value="lt">Lietuvių</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Brand style
                  </label>
                  <select
                    name="brandStyle"
                    value={formData.brandStyle}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  >
                    <option value="premium">Premium</option>
                    <option value="sales">Akcijinis</option>
                    <option value="performance">Performance</option>
                    <option value="neutral">Neutralus</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Output mode
                  </label>
                  <select
                    name="outputMode"
                    value={formData.outputMode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  >
                    <option value="google_ads">Google Ads</option>
                    <option value="seo">SEO</option>
                    <option value="universal">Universalus</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generuojama..." : "Generuoti tekstus"}
                </button>

                <button
                  type="button"
                  onClick={generateTexts}
                  disabled={loading}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Rezultatai</h2>
              {copied && <p className="text-sm text-emerald-400">{copied}</p>}
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                {error}
              </div>
            )}

            {!result && !error && !loading && (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-white/50">
                Užpildyk formą ir spausk „Generuoti tekstus“.
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/60">
                AI dabar kuria tekstus...
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-white/50">Google Ads Headlines</p>
                    <button
                      type="button"
                      onClick={() => copyList("Visi headlines", result.headlines)}
                      className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                    >
                      Copy all
                    </button>
                  </div>

                  <ul className="space-y-2 text-white/90">
                    {result.headlines?.map((headline, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-white/10 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p>
                              {index + 1}. {headline}
                            </p>
                            <p
                              className={`mt-2 text-xs ${getCountClass(
                                headline.length,
                                LIMITS.headline
                              )}`}
                            >
                              {headline.length}/{LIMITS.headline}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(`Headline ${index + 1}`, headline)
                            }
                            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                          >
                            Copy
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-white/50">
                      Google Ads Descriptions
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        copyList("Visi descriptions", result.descriptions)
                      }
                      className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                    >
                      Copy all
                    </button>
                  </div>

                  <ul className="space-y-2 text-white/90">
                    {result.descriptions?.map((description, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-white/10 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p>
                              {index + 1}. {description}
                            </p>
                            <p
                              className={`mt-2 text-xs ${getCountClass(
                                description.length,
                                LIMITS.description
                              )}`}
                            >
                              {description.length}/{LIMITS.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(`Description ${index + 1}`, description)
                            }
                            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                          >
                            Copy
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm text-white/50">SEO Meta Title</p>
                    <button
                      type="button"
                      onClick={() => copyText("SEO Meta Title", result.metaTitle)}
                      className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                    >
                      Copy
                    </button>
                  </div>

                  <p className="text-white/90">{result.metaTitle}</p>
                  <p
                    className={`mt-2 text-xs ${getCountClass(
                      result.metaTitle.length,
                      LIMITS.metaTitle
                    )}`}
                  >
                    {result.metaTitle.length}/{LIMITS.metaTitle}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-sm text-white/50">
                      SEO Meta Description
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          "SEO Meta Description",
                          result.metaDescription
                        )
                      }
                      className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                    >
                      Copy
                    </button>
                  </div>

                  <p className="text-white/90">{result.metaDescription}</p>
                  <p
                    className={`mt-2 text-xs ${getCountClass(
                      result.metaDescription.length,
                      LIMITS.metaDescription
                    )}`}
                  >
                    {result.metaDescription.length}/{LIMITS.metaDescription}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}