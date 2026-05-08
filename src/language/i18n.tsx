import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

/**
 * Minimal inline fallback so components render before
 * the full translation bundle arrives from CDN.
 * Full en.json / vi.json live on CDN at library/language/
 * and are loaded at runtime by loadCdnTranslations().
 */
const minimalFallback: Record<string, string> = {
    cancel: "Cancel",
    submit: "Submit",
    apply: "Apply",
    save: "Save",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    select: "Select",
    confirm: "Confirm",
    noResultFound: "No result found",
    noData: "No data.",
}

const resources = {
    en: { translation: minimalFallback },
}

// Initialize i18n
i18n.use(initReactI18next).init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language
    interpolation: {
        escapeValue: false, // React already escapes values
    },
})

/**
 * Fetch full translation bundles from CDN and merge into i18n.
 * Called once by EbigProvider on mount.
 * Falls back silently to the minimal inline bundle on network error.
 */
export async function loadCdnTranslations(cdnBase: string, languages: string[] = ['en', 'vi']) {
    await Promise.allSettled(
        languages.map(async (lng) => {
            try {
                const res = await fetch(`${cdnBase}/library/language/v0.0.55/${lng}.json`, { headers: { "Cache-Control": "no-cache" } });
                if (res.ok) {
                    const data = await res.json();
                    i18n.addResourceBundle(lng, 'translation', data, true, true);
                }
            } catch {
                // silently fall back to bundled minimal translations
            }
        })
    );
}

export { i18n, useTranslation }
