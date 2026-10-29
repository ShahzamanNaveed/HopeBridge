import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en/translation.json';
import ur from './ur/translation.json';
let savedLanguage = 'en';
try {
  if (localStorage.getItem('hopebridge.language') === 'ur')
    savedLanguage = 'ur';
} catch {
  /* Language switching remains available when storage is disabled. */
}
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  try {
    localStorage.setItem(
      'hopebridge.language',
      language === 'ur' ? 'ur' : 'en',
    );
  } catch {
    /* Optional preference only; no authentication material is stored. */
  }
});
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
export default i18n;
