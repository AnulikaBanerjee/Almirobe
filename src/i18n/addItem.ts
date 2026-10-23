export type UiLocale = 'en-IN' | 'hi-IN' | 'bn-IN' | 'kn-IN';

export const UI_LOCALES: { value: UiLocale; label: string }[] = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'bn-IN', label: 'বাংলা' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ' },
];

const COPY: Record<UiLocale, Record<string, string>> = {
  'en-IN': {
    addTitle: 'Add item',
    photo: 'Photo',
    cutoutBusy: 'Cutout in progress',
    tagsBusy: 'Detecting tags…',
    name: 'Item name',
    type: 'Type',
    subtype: 'Subtype',
    occasion: 'Occasion',
    weather: 'Weather',
    color: 'Colour',
    brand: 'Brand',
    size: 'Size',
    shelf: 'Shelf',
    notes: 'Notes',
    mic: 'Speak details',
    listening: 'Listening… tap to stop',
    heard: 'Heard',
    understood: 'Understood',
    speechUnsupported: 'Voice needs Chrome or Edge, with microphone allowed',
    cancel: 'Cancel',
    save: 'Add to wardrobe',
    language: 'Language',
  },
  'hi-IN': {
    addTitle: 'वस्त्र जोड़ें',
    photo: 'फ़ोटो',
    cutoutBusy: 'कटआउट बन रहा है',
    tagsBusy: 'टैग पहचाने जा रहे हैं…',
    name: 'नाम',
    type: 'प्रकार',
    subtype: 'उपप्रकार',
    occasion: 'अवसर',
    weather: 'मौसम',
    color: 'रंग',
    brand: 'ब्रांड',
    size: 'साइज़',
    shelf: 'शेल्फ',
    notes: 'नोट्स',
    mic: 'बोलकर भरें',
    listening: 'सुन रहे हैं… रोकने के लिए टैप करें',
    heard: 'सुना',
    understood: 'समझा',
    speechUnsupported: 'आवाज़ Chrome या Edge में माइक अनुमति के साथ चलती है',
    cancel: 'रद्द',
    save: 'अलमारी में जोड़ें',
    language: 'भाषा',
  },
  'bn-IN': {
    addTitle: 'পোশাক যোগ করুন',
    photo: 'ছবি',
    cutoutBusy: 'কাটআউট তৈরি হচ্ছে',
    tagsBusy: 'ট্যাগ শনাক্ত হচ্ছে…',
    name: 'নাম',
    type: 'ধরন',
    subtype: 'উপধরন',
    occasion: 'উপলক্ষ',
    weather: 'আবহাওয়া',
    color: 'রং',
    brand: 'ব্র্যান্ড',
    size: 'সাইজ',
    shelf: 'তাক',
    notes: 'নোট',
    mic: 'কথা বলে পূরণ',
    listening: 'শুনছি… থামাতে ট্যাপ করুন',
    heard: 'শোনা গেছে',
    understood: 'বোঝা গেছে',
    speechUnsupported: 'ভয়েস Chrome বা Edge-এ মাইক অনুমতি নিয়ে কাজ করে',
    cancel: 'বাতিল',
    save: 'আলমারিতে যোগ',
    language: 'ভাষা',
  },
  'kn-IN': {
    addTitle: 'ವಸ್ತು ಸೇರಿಸಿ',
    photo: 'ಫೋಟೋ',
    cutoutBusy: 'ಕಟ್‌ಔಟ್ ಆಗುತ್ತಿದೆ',
    tagsBusy: 'ಟ್ಯಾಗ್‌ಗಳನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿದೆ…',
    name: 'ಹೆಸರು',
    type: 'ವಿಧ',
    subtype: 'ಉಪವಿಧ',
    occasion: 'ಸಂದರ್ಭ',
    weather: 'ಹವಾಮಾನ',
    color: 'ಬಣ್ಣ',
    brand: 'ಬ್ರಾಂಡ್',
    size: 'ಗಾತ್ರ',
    shelf: 'ಶೆಲ್ಫ್',
    notes: 'ಟಿಪ್ಪಣಿ',
    mic: 'ಮಾತನಾಡಿ ಭರ್ತಿ',
    listening: 'ಕೇಳುತ್ತಿದೆ… ನಿಲ್ಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    heard: 'ಕೇಳಿದೆ',
    understood: 'ಅರ್ಥವಾಯಿತು',
    speechUnsupported: 'ಧ್ವನಿ Chrome ಅಥವಾ Edgeನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಯೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    cancel: 'ರದ್ದು',
    save: 'ಬೀರಿಗೆ ಸೇರಿಸಿ',
    language: 'ಭಾಷೆ',
  },
};

const STORAGE_KEY = 'almirobe.uiLocale';

export function getStoredUiLocale(): UiLocale {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === 'hi-IN' || value === 'bn-IN' || value === 'kn-IN' || value === 'en-IN') {
    return value;
  }
  return 'en-IN';
}

export function setStoredUiLocale(locale: UiLocale): void {
  localStorage.setItem(STORAGE_KEY, locale);
}

export function t(locale: UiLocale, key: string): string {
  return COPY[locale][key] ?? COPY['en-IN'][key] ?? key;
}
