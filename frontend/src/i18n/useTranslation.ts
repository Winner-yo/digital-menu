import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Lang, TranslationKey } from './translations';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

export const useLang = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang][key] || translations.en[key] || key,
    }),
    { name: 'language-storage' }
  )
);

export const useT = () => {
  const { t, lang, setLang } = useLang();
  return { t, lang, setLang };
};
