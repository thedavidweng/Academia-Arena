import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zh from './zh.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: 'en',
  fallbackLng: 'en',
  keySeparator: false,
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', language => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }
});

export default i18n;
