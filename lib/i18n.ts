export const languages = [
  { code: 'en', label: 'English' }, { code: 'ta', label: 'தமிழ்' }, { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' }, { code: 'kn', label: 'ಕನ್ನಡ' }, { code: 'ml', label: 'മലയാളം' }
] as const;
export type Language = typeof languages[number]['code'];
const messages: Record<Language, Record<string, string>> = {
  en: { Overview:'Overview', Assistant:'Assistant', Resume:'Resume', 'Job Matcher':'Job Matcher', Questions:'Questions', Interview:'Interview', Universe:'Universe', 'Skill Arena':'Skill Arena', Roadmap:'Roadmap', Radar:'Radar', Twin:'Twin', Activity:'Activity', Settings:'Settings', 'Sign out':'Sign out' },
  ta: { Overview:'கண்ணோட்டம்', Assistant:'உதவியாளர்', Resume:'சுயவிவரம்', 'Job Matcher':'வேலை பொருத்தம்', Questions:'கேள்விகள்', Interview:'நேர்காணல்', Universe:'திறன் பிரபஞ்சம்', 'Skill Arena':'திறன் பயிற்சி', Roadmap:'வழித்தடம்', Radar:'வேலை வாய்ப்புகள்', Twin:'தொழில் துணை', Activity:'செயல்பாடு', Settings:'அமைப்புகள்', 'Sign out':'வெளியேறு' },
  hi: { Overview:'अवलोकन', Assistant:'सहायक', Resume:'रिज़्यूमे', 'Job Matcher':'नौकरी मिलान', Questions:'प्रश्न', Interview:'साक्षात्कार', Universe:'कौशल ब्रह्मांड', 'Skill Arena':'कौशल अभ्यास', Roadmap:'रोडमैप', Radar:'अवसर', Twin:'करियर साथी', Activity:'गतिविधि', Settings:'सेटिंग्स', 'Sign out':'साइन आउट' },
  te: { Overview:'సారాంశం', Assistant:'సహాయకుడు', Resume:'రెజ్యూమే', 'Job Matcher':'ఉద్యోగ సరిపోలిక', Questions:'ప్రశ్నలు', Interview:'ఇంటర్వ్యూ', Universe:'నైపుణ్య విశ్వం', 'Skill Arena':'నైపుణ్య సాధన', Roadmap:'రోడ్‌మ్యాప్', Radar:'అవకాశాలు', Twin:'కెరీర్ సహాయకుడు', Activity:'కార్యకలాపం', Settings:'సెట్టింగ్‌లు', 'Sign out':'సైన్ అవుట్' },
  kn: { Overview:'ಅವಲೋಕನ', Assistant:'ಸಹಾಯಕ', Resume:'ರೆಸ್ಯೂಮ್', 'Job Matcher':'ಉದ್ಯೋಗ ಹೊಂದಾಣಿಕೆ', Questions:'ಪ್ರಶ್ನೆಗಳು', Interview:'ಸಂದರ್ಶನ', Universe:'ಕೌಶಲ್ಯ ವಿಶ್ವ', 'Skill Arena':'ಕೌಶಲ್ಯ ಅಭ್ಯಾಸ', Roadmap:'ಮಾರ್ಗಸೂಚಿ', Radar:'ಅವಕಾಶಗಳು', Twin:'ವೃತ್ತಿ ಸಹಾಯಕ', Activity:'ಚಟುವಟಿಕೆ', Settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'Sign out':'ಸೈನ್ ಔಟ್' },
  ml: { Overview:'അവലോകനം', Assistant:'സഹായി', Resume:'റെസ്യൂമെ', 'Job Matcher':'ജോലി പൊരുത്തം', Questions:'ചോദ്യങ്ങൾ', Interview:'അഭിമുഖം', Universe:'നൈപുണ്യ ലോകം', 'Skill Arena':'നൈപുണ്യ പരിശീലനം', Roadmap:'റോഡ്മാപ്പ്', Radar:'അവസരങ്ങൾ', Twin:'കരിയർ സഹായി', Activity:'പ്രവർത്തനം', Settings:'ക്രമീകരണങ്ങൾ', 'Sign out':'സൈൻ ഔട്ട്' }
};
export function translate(key: string, language: string): string {
  const lang = (language in messages ? language : 'en') as Language;
  return messages[lang][key] || messages.en[key] || key;
}
