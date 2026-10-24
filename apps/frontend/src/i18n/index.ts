import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en/translation.json';
import ur from './ur/translation.json';
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
});
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
export default i18n;
