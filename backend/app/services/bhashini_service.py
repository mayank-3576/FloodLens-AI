import os
import logging
import httpx
from typing import Dict, Any, List, Optional

logger = logging.getLogger("floodlens.bhashini")

# Bhashini API configuration
BHASHINI_API_KEY = os.getenv("BHASHINI_API_KEY", "")
BHASHINI_USER_ID = os.getenv("BHASHINI_USER_ID", "")
BHASHINI_PIPELINE_ID = os.getenv("BHASHINI_PIPELINE_ID", "")
BHASHINI_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English", "native": "English", "script": "Latin"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "script": "Devanagari"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা", "script": "Bengali"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்", "script": "Tamil"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు", "script": "Telugu"},
    {"code": "mr", "name": "Marathi", "native": "मराठी", "script": "Devanagari"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી", "script": "Gujarati"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "script": "Kannada"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "script": "Malayalam"},
    {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ", "script": "Gurmukhi"},
    {"code": "or", "name": "Odia", "native": "ଓଡ଼ିଆ", "script": "Odia"},
    {"code": "as", "name": "Assamese", "native": "অসমীয়া", "script": "Bengali"},
    {"code": "ur", "name": "Urdu", "native": "اردو", "script": "Perso-Arabic"},
]

# Essential offline civil defense and flood intelligence translation bank
BUILTIN_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "hi": {
        "disclaimer": "अस्वीकरण: ऐतिहासिक बाढ़ रिकॉर्ड और वर्षा संकेतक भविष्य के बाढ़ पूर्वानुमान की गारंटी नहीं देते हैं। हमेशा आधिकारिक आपदा प्रबंधन (IMD/CWC/NDMA) निर्देशों का पालन करें।",
        "early_warning": "प्रारंभिक चेतावनी प्रणाली",
        "short_range": "अल्पकालिक चेतावनी (0–72 घंटे)",
        "medium_range": "मध्यम अवधि निगरानी (3–7 दिन)",
        "early_outlook": "विस्तारित दृष्टिकोण (7–14 दिन)",
        "critical_risk": "गंभीर जोखिम: बाढ़ का खतरा तत्काल बना हुआ है। निचले इलाकों से सुरक्षित स्थानों पर जाएं।",
        "elevated_risk": "उच्च जोखिम: जलस्तर चेतावनी निशान के करीब। सतर्क रहें।",
        "moderate_risk": "मध्यम जोखिम: जलभराव संभव। जल निकासी मार्गों पर नजर रखें।",
        "low_risk": "सामान्य स्थिति: तात्कालिक बाढ़ का कोई संकेत नहीं।",
        "precaution_1": "जलमग्न सड़कों और अंडरपास से वाहन न निकालें।",
        "precaution_2": "पीने का साफ पानी, प्राथमिक चिकित्सा किट और बैटरी टॉर्च तैयार रखें।",
        "precaution_3": "घरों में पानी भरने पर तुरंत बिजली का मुख्य स्विच बंद कर दें।",
        "precaution_4": "स्थानीय प्रशासन और आपदा नियंत्रण कक्ष (112 या 1070) से संपर्क बनाए रखें।",
        "emergency_call": "आपातकालीन हेल्पलाइन: 112 / 1070",
        "data_gap_warning": "नोट: इस नगर में समर्पित एडब्ल्यूएस माइक्रो-सेंसर नहीं है; जिला-स्तरीय ग्रिड डेटा प्रदर्शित है।"
    },
    "bn": {
        "disclaimer": "দাবিত্যাগ: ঐতিহাসিক বন্যার রেকর্ড এবং বৃষ্টিপাতের সূচক ভবিষ্যতের বন্যার পূর্বাভাসের নিশ্চয়তা দেয় না। সর্বদা সরকারি IMD/CWC/NDMA নির্দেশনা অনুসরণ করুন।",
        "early_warning": "বন্যা আগাম সতর্কতা ব্যবস্থা",
        "short_range": "স্বল্পমেয়াদী সতর্কতা (০–৭২ ঘণ্টা)",
        "medium_range": "মধ্যম-মেয়াদী পর্যবেক্ষণ (৩–৭ দিন)",
        "early_outlook": "প্রসারিত পূর্বাভাস (৭–১৪ দিন)",
        "critical_risk": "সংকটপূর্ণ ঝুঁকি: বন্যার তীব্র ঝুঁকি রয়েছে। অবিলম্বে উঁচু ও নিরাপদ স্থানে আশ্রয় নিন।",
        "elevated_risk": "উচ্চ ঝুঁকি: নদীর জল বিপদসীমার কাছাকাছি। সতর্ক থাকুন।",
        "moderate_risk": "মাঝারি ঝুঁকি: কিছু এলাকায় জলাবদ্ধতা হতে পারে।",
        "low_risk": "স্বাভাবিক: কোনো তাৎক্ষণিক বন্যার ঝুঁকি নেই।",
        "precaution_1": "প্লাবিত রাস্তা বা আন্ডারপাস দিয়ে যাতায়াত করবেন না।",
        "precaution_2": "বিশুদ্ধ পানীয় জল, শুকনো খাবার এবং প্রাথমিক চিকিৎসার ওষুধ প্রস্তুত রাখুন।",
        "precaution_3": "বাড়িতে জল ঢুকলে মেইন সুইচ বন্ধ করে বিদ্যুৎ সংযোগ বিচ্ছিন্ন করুন।",
        "precaution_4": "জরুরি প্রয়োজনে জেলা বিপর্যয় নিয়ন্ত্রণ কক্ষে যোগাযোগ করুন (১১২ / ১০৭০)।",
        "emergency_call": "জরুরি হেল্পলাইন: ১১২ / ১০৭০",
        "data_gap_warning": "বিজ্ঞপ্তি: এই শহরে পৃথক গেজ অনুপস্থিত; জেলা স্তরের পরিমাপ ব্যবহৃত হচ্ছে।"
    },
    "ta": {
        "disclaimer": "பொறுப்புத் துறப்பு: வரலாற்று வெள்ளப் பதிவுகள் மற்றும் மழைப்பொழிவு குறிகாட்டிகள் எதிர்கால வெள்ள முன்னறிவிப்பை உறுதிப்படுத்தாது. அதிகாரப்பூர்வ IMD/CWC/NDMA வழிகாட்டுதல்களைப் பின்பற்றவும்.",
        "early_warning": "வெள்ள முன்னெச்சரிக்கை அமைப்பு",
        "short_range": "குறுகிய கால எச்சரிக்கை (0–72 மணி நேரம்)",
        "medium_range": "நடுத்தர கால கண்காணிப்பு (3–7 நாட்கள்)",
        "early_outlook": "நீட்டிக்கப்பட்ட கண்ணோட்டம் (7–14 நாட்கள்)",
        "critical_risk": "அபாயகரமான நிலை: உடனடி வெள்ள அபாயம் உள்ளது. பாதுகாப்பான மேடான இடங்களுக்குச் செல்லவும்.",
        "elevated_risk": "உயர்ந்த அபாயம்: நீர்மட்டம் எச்சரிக்கை அளவை நெருங்குகிறது.",
        "moderate_risk": "மிதமான அபாயம்: தாழ்வான பகுதிகளில் தேக்கமடையும் வாய்ப்பு.",
        "low_risk": "சாதாரண நிலை: தற்போதைய வெள்ள அச்சுறுத்தல் இல்லை.",
        "precaution_1": "நீர் சூழ்ந்த சுரங்கப்பாதைகள் மற்றும் சாலைகளில் வாகனங்களை இயக்க வேண்டாம்.",
        "precaution_2": "குடிநீர், அத்தியாவசிய மருந்துகள் மற்றும் அவசர விளக்குகளை தயாராக வைத்திருக்கவும்.",
        "precaution_3": "வீட்டிற்குள் நீர் புகுந்தால் மின் இணைப்பை உடனடியாக அணைக்கவும்.",
        "precaution_4": "அரசு அவசர உதவி எண்களைத் தொடர்பு கொள்ளவும் (112 அல்லது 1070).",
        "emergency_call": "அவசர உதவி எண்: 112 / 1070",
        "data_gap_warning": "குறிப்பு: இந்த ஊரில் தனித்துவமான மழைமானி இல்லை; மாவட்ட அளவிலான தரவு பயன்படுத்தப்படுகிறது."
    },
    "te": {
        "disclaimer": "నిరాకరణ: చారిత్రక వరద రికార్డులు మరియు వర్షపాత సూచికలు భవిష్యత్ వరదను హామీ ఇవ్వలేవు. అధికారిక IMD/CWC/NDMA హెచ్చరికలను పాటించండి.",
        "early_warning": "ముందస్తు వరద హెచ్చరిక వ్యవస్థ",
        "short_range": "స్వల్పకాలిక హెచ్చరిక (0–72 గంటలు)",
        "medium_range": "మధ్యస్థ కాల పర్యవేక్షణ (3–7 రోజులు)",
        "early_outlook": "దీర్ఘకాలిక పరిశీలన (7–14 రోజులు)",
        "critical_risk": "తీవ్రమైన ప్రమాదం: తక్షణ వరద ముప్పు ఉంది. ఎత్తైన సురక్షిత ప్రాంతాలకు తరలి వెళ్ళండి.",
        "elevated_risk": "హెచ్చరిక ప్రమాదం: నదీ ప్రవాహం ప్రమాద స్థాయికి చేరువవుతోంది.",
        "moderate_risk": "మధ్యస్థ ప్రమాదం: లోతట్టు ప్రాంతాలలో నీరు నిలిచే అవకాశం.",
        "low_risk": "సాధారణం: తక్షణ వరద ముప్పు లేదు.",
        "precaution_1": "నీరు నిండిన అండర్‌పాస్‌లు మరియు వంతెనల గుండా ప్రయాణించవద్దు.",
        "precaution_2": "త్రాగునీరు, మందులు మరియు టార్చ్ లైట్లను సిద్ధంగా ఉంచుకోండి.",
        "precaution_3": "ఇంట్లోకి నీరు వస్తే వెంటనే విద్యుత్ సరఫరా ఆపివేయండి.",
        "precaution_4": "సహాయం కొరకు అత్యవసర నంబర్లు 112 లేదా 1070 సంప్రదించండి.",
        "emergency_call": "అత్యవసర హెల్ప్‌లైన్: 112 / 1070",
        "data_gap_warning": "గమనిక: ఈ పట్టణంలో ప్రత్యేక వర్షమాపకం లేదు; జిల్లా స్థాయి గ్రిడ్ డేటా చూపించబడింది."
    },
    "mr": {
        "disclaimer": "अस्वीकरण: ऐतिहासिक पूर नोंदी आणि पर्जन्यमान निर्देशक भविष्यातील पुराचा अंदाज हमी देत नाहीत. अधिकृत IMD/CWC/NDMA निर्देशांचे पालन करा.",
        "early_warning": "पूर पूर्वसूचना यंत्रणा",
        "short_range": "अल्पकालीन इशारा (०–७२ तास)",
        "medium_range": "मध्यम मुदत देखरेख (३–७ दिवस)",
        "early_outlook": "विस्तारित अंदाज (७–१४ दिवस)",
        "critical_risk": "गंभीर धोका: पुराचा तातडीचा धोका संभवतो. सुरक्षित ठिकाणी स्थलांतर करा.",
        "elevated_risk": "वाढलेला धोका: पाणीपातळी इशारा पातळीच्या जवळ. सावध राहा.",
        "moderate_risk": "मध्यम धोका: सखल भागात पाणी साचण्याची शक्यता.",
        "low_risk": "सामान्य: सध्या कोणताही पूर धोका नाही.",
        "precaution_1": "पाण्याखाली गेलेल्या रस्त्यांवरून किंवा सबवेमधून वाहने चालवू नका.",
        "precaution_2": "पिण्याचे पाणी, प्रथमोपचार औषधे आणि बॅटरी टॉर्च जवळ ठेवा.",
        "precaution_3": "घरात पाणी शिरल्यास मुख्य वीज पुरवठा त्वरित बंद करा.",
        "precaution_4": "स्थानिक आपत्ती व्यवस्थापन कक्षाशी संपर्क साधा (११२ किंवा १०७०).",
        "emergency_call": "आपत्कालीन हेल्पलाइन: ११२ / १०७०",
        "data_gap_warning": "सूचना: या शहरात स्वतंत्र एडब्ल्यूएस गेज उपलब्ध नाही; जिल्हा-स्तरीय ग्रिड माहिती लागू आहे."
    },
    "gu": {
        "disclaimer": "અસ્વીકરણ: ઐતિહાસિક પૂર રેકોર્ડ અને વરસાદના સૂચકાંકો ભવિષ્યના પૂરની ખાતરી આપતા નથી. સત્તાવાર IMD/CWC/NDMA સૂચનાઓનું પાલન કરો.",
        "early_warning": "પૂર પૂર્વ ચેતવણી પ્રણાલી",
        "short_range": "ટૂંકા ગાળાની ચેતવણી (૦–૭૨ કલાક)",
        "medium_range": "મધ્યમ ગાળાનું નિરીક્ષણ (૩–૭ દિવસ)",
        "early_outlook": "વિસ્તૃત દ્રષ્ટિકોણ (૭–૧૪ દિવસ)",
        "critical_risk": "ગંભીર જોખમ: પૂરનું તાત્કાલિક જોખમ છે. ઊંચા અને સુરક્ષિત સ્થળે ખસી જાઓ.",
        "elevated_risk": "વધેલું જોખમ: જળસ્તર ચેતવણી ચિહ્નની નજીક છે.",
        "moderate_risk": "મધ્યમ જોખમ: નીચાણવાળા વિસ્તારોમાં પાણી ભરાવાની શક્યતા.",
        "low_risk": "સામાન્ય: કોઈ તાત્કાલિક પૂરનું જોખમ નથી.",
        "precaution_1": "પાણી ભરાયેલા અંડરપાસ કે રસ્તાઓ પરથી વાહન ચલાવશો નહીં.",
        "precaution_2": "પીવાનું પાણી, દવાઓ અને ટોર્ચ તૈયાર રાખો.",
        "precaution_3": "ઘરમાં પાણી ભરાય ત્યારે વીજળીનું મુખ્ય સ્વિચ બંધ કરો.",
        "precaution_4": "ઈમરજન્સી હેલ્પલાઈન ૧૧૨ અથવા ૧૦૭૦ પર સંપર્ક કરો.",
        "emergency_call": "ઈમરજન્સી હેલ્પલાઈન: ૧૧૨ / ૧૦૭૦",
        "data_gap_warning": "નોંધ: આ શહેરમાં સ્વતંત્ર રેઇન ગેજ નથી; જિલ્લા સ્તરનો ડેટા ઉપયોગમાં લેવાયેલ છે."
    },
    "kn": {
        "disclaimer": "ಹಕ್ಕುತ್ಯಾಗ: ಐತಿಹಾಸಿಕ ಪ್ರವಾಹ ದಾಖಲೆಗಳು ಮತ್ತು ಮಳೆಯ ಸೂಚಕಗಳು ಭವಿಷ್ಯದ ಪ್ರವಾಹವನ್ನು ಖಾತರಿಪಡಿಸುವುದಿಲ್ಲ. ಅಧಿಕೃತ IMD/CWC/NDMA ನಿರ್ದೇಶನಗಳನ್ನು ಅನುಸರಿಸಿ.",
        "early_warning": "ಪ್ರವಾಹ ಮುನ್ನೆಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆ",
        "short_range": "ಅಲ್ಪಾವಧಿ ಎಚ್ಚರಿಕೆ (0–72 ಗಂಟೆಗಳು)",
        "medium_range": "ಮಧ್ಯಮಾವಧಿ ಮೇಲ್ವಿಚಾರಣೆ (3–7 ದಿನಗಳು)",
        "early_outlook": "ವಿಸ್ತರಿತ ಮುನ್ನೋಟ (7–14 ದಿನಗಳು)",
        "critical_risk": "ತೀವ್ರ ಅಪಾಯ: ತಕ್ಷಣದ ಪ್ರವಾಹದ ಅಪಾಯವಿದೆ. ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಿ.",
        "elevated_risk": "ಹೆಚ್ಚಿದ ಅಪಾಯ: ನೀರಿನ ಮಟ್ಟವು ಎಚ್ಚರಿಕೆಯ ಮಟ್ಟವನ್ನು ತಲುಪುತ್ತಿದೆ.",
        "moderate_risk": "ಮಧ್ಯಮ ಅಪಾಯ: ತಗ್ಗು ಪ್ರದೇಶಗಳಲ್ಲಿ ನೀರು ನಿಲ್ಲುವ ಸಾಧ್ಯತೆ.",
        "low_risk": "ಸಾಮಾನ್ಯ: ತಕ್ಷಣದ ಪ್ರವಾಹದ ಭೀತಿಯಿಲ್ಲ.",
        "precaution_1": "ನೀರು ತುಂಬಿದ ಅಂಡರ್‌ಪಾಸ್‌ಗಳು ಮತ್ತು ರಸ್ತೆಗಳಲ್ಲಿ ವಾಹನ ಚಲಾಯಿಸಬೇಡಿ.",
        "precaution_2": "ಕುಡಿಯುವ ನೀರು, ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಔಷಧಿಗಳು ಮತ್ತು ಟಾರ್ಚ್ ಸಿದ್ಧವಾಗಿಡಿ.",
        "precaution_3": "ಮನೆಗೆ ನೀರು ನುಗ್ಗಿದರೆ ತಕ್ಷಣ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಿ.",
        "precaution_4": "ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ 112 ಅಥವಾ 1070 ಗೆ ಕರೆ ಮಾಡಿ.",
        "emergency_call": "ತುರ್ತು ಸಹಾಯವಾಣಿ: 112 / 1070",
        "data_gap_warning": "ಸೂಚನೆ: ಈ ಪಟ್ಟಣದಲ್ಲಿ ಪ್ರತ್ಯೇಕ ಮಳೆಮಾಪಕವಿಲ್ಲ; ಜಿಲ್ಲಾ ಮಟ್ಟದ ದತ್ತಾಂಶ ಬಳಸಲಾಗಿದೆ."
    },
    "ml": {
        "disclaimer": "നിരാകരണം: മുൻകാല വെള്ളപ്പൊക്ക രേഖകളും മഴയുടെ സൂചകങ്ങളും ഭാവിയിലെ പ്രവചനത്തിന് ഉറപ്പുനൽകുന്നില്ല. ഔദ്യോഗിക IMD/CWC/NDMA നിർദ്ദേശങ്ങൾ പാലിക്കുക.",
        "early_warning": "വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ് സംവിധാനം",
        "short_range": "ഹ്രസ്വകാല മുന്നറിയിപ്പ് (0–72 മണിക്കൂർ)",
        "medium_range": "ഇടത്തരം നിരീക്ഷണം (3–7 ദിവസം)",
        "early_outlook": "ദീർഘകാല വീക്ഷണം (7–14 ദിവസം)",
        "critical_risk": "ഗുരുതരമായ അപകടസാധ്യത: വെള്ളപ്പൊക്ക ഭീഷണി നിലനിൽക്കുന്നു. സുരക്ഷിത സ്ഥാനങ്ങളിലേക്ക് മാറുക.",
        "elevated_risk": "ഉയർന്ന അപകടസാധ്യത: ജലനിരപ്പ് മുന്നറിയിപ്പ് രേഖയിലേക്ക് ഉയരുന്നു.",
        "moderate_risk": "മിതമായ അപകടസാധ്യത: താഴ്ന്ന പ്രദേശങ്ങളിൽ വെള്ളക്കെട്ടിന് സാധ്യത.",
        "low_risk": "സാധാരണ നില: നിലവിൽ വെള്ളപ്പൊക്ക ഭീഷണിയില്ല.",
        "precaution_1": "വെള്ളക്കെട്ടുള്ള റോഡുകളിലൂടെയോ അടിപ്പാതകളിലൂടെയോ വാഹനം ഓടിക്കരുത്.",
        "precaution_2": "കുടിവെള്ളം, അവശ്യ മരുന്നുകൾ, ടോർച്ച് എന്നിവ കരുതുക.",
        "precaution_3": "വീട്ടിൽ വെള്ളം കയറിയാൽ ഉടൻ മെയിൻ സ്വിച്ച് ഓഫാക്കുക.",
        "precaution_4": "അടിയന്തര സഹായത്തിന് 112 അല്ലെങ്കിൽ 1070 എന്നീ നമ്പറുകളിൽ ബന്ധപ്പെടുക.",
        "emergency_call": "അടിയന്തര ഹെൽപ്പ് ലൈൻ: 112 / 1070",
        "data_gap_warning": "കുറിപ്പ്: ഈ നഗരത്തിൽ പ്രത്യേക മഴമാപിനി ലഭ്യമല്ല; ജില്ലാ തലത്തിലുള്ള വിവരങ്ങളാണ് നൽകിയിട്ടുള്ളത്."
    },
    "pa": {
        "disclaimer": "ਬੇਦਾਅਵਾ: ਪੁਰਾਣੇ ਹੜ੍ਹ ਰਿਕਾਰਡ ਅਤੇ ਮੀਂਹ ਦੇ ਸੰਕੇਤ ਭਵਿੱਖ ਦੇ ਹੜ੍ਹਾਂ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ ਦਿੰਦੇ। ਅਧਿਕਾਰਤ IMD/CWC/NDMA ਹਦਾਇਤਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ।",
        "early_warning": "ਹੜ੍ਹ ਅਗਾਊਂ ਚੇਤਾਵਨੀ ਪ੍ਰਣਾਲੀ",
        "short_range": "ਥੋੜ੍ਹੇ ਸਮੇਂ ਦੀ ਚੇਤਾਵਨੀ (0–72 ਘੰਟੇ)",
        "medium_range": "ਦਰਮਿਆਨੇ ਸਮੇਂ ਦੀ ਨਿਗਰਾਨੀ (3–7 ਦਿਨ)",
        "early_outlook": "ਵਿਸਤ੍ਰਿਤ ਦ੍ਰਿਸ਼ਟੀਕੋਣ (7–14 ਦਿਨ)",
        "critical_risk": "ਨਾਜ਼ੁਕ ਖ਼ਤਰਾ: ਹੜ੍ਹ ਦਾ ਤੁਰੰਤ ਖ਼ਤਰਾ ਹੈ। ਉੱਚੇ ਅਤੇ ਸੁਰੱਖਿਅਤ ਸਥਾਨਾਂ ਤੇ ਜਾਓ।",
        "elevated_risk": "ਵਧਿਆ ਖ਼ਤਰਾ: ਪਾਣੀ ਦਾ ਪੱਧਰ ਖ਼ਤਰੇ ਦੇ ਨਿਸ਼ਾਨ ਵੱਲ ਵਧ ਰਿਹਾ ਹੈ।",
        "moderate_risk": "ਦਰਮਿਆਨਾ ਖ਼ਤਰਾ: ਨੀਵੇਂ ਇਲਾਕਿਆਂ ਵਿੱਚ ਪਾਣੀ ਭਰਨ ਦਾ ਖ਼ਦਸ਼ਾ।",
        "low_risk": "ਆਮ ਹਾਲਤ: ਕੋਈ ਤੁਰੰਤ ਹੜ੍ਹ ਖ਼ਤਰਾ ਨਹੀਂ।",
        "precaution_1": "ਪਾਣੀ ਨਾਲ ਭਰੀਆਂ ਸੜਕਾਂ ਜਾਂ ਅੰਡਰਪਾਸਾਂ ਵਿੱਚੋਂ ਗੱਡੀਆਂ ਨਾ ਕੱਢੋ।",
        "precaution_2": "ਪੀਣ ਵਾਲਾ ਪਾਣੀ, ਦਵਾਈਆਂ ਅਤੇ ਟਾਰਚ ਤਿਆਰ ਰੱਖੋ।",
        "precaution_3": "ਘਰ ਵਿੱਚ ਪਾਣੀ ਦਾਖ਼ਲ ਹੋਣ ਤੇ ਬਿਜਲੀ ਦਾ ਮੇਨ ਸਵਿੱਚ ਬੰਦ ਕਰੋ।",
        "precaution_4": "ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ 112 ਜਾਂ 1070 ਤੇ ਸੰਪਰਕ ਕਰੋ।",
        "emergency_call": "ਐਮਰਜੈਂਸੀ ਹੈਲਪਲਾਈਨ: 112 / 1070",
        "data_gap_warning": "ਨੋਟ: ਇਸ ਸ਼ਹਿਰ ਵਿੱਚ ਵੱਖਰਾ ਗੇਜ ਨਹੀਂ ਹੈ; ਜ਼ਿਲ੍ਹਾ ਪੱਧਰੀ ਡਾਟਾ ਵਰਤਿਆ ਗਿਆ ਹੈ।"
    },
    "or": {
        "disclaimer": "ଦାୟିତ୍ୱହୀନତା ଘୋଷଣା: ଅତୀତର ବନ୍ୟା ରେକର୍ଡ ଏବଂ ବର୍ଷା ସୂଚକ ଭବିଷ୍ୟତର ବନ୍ୟା ପୂର୍ବାନୁମାନର ନିଶ୍ଚିତତା ଦିଏ ନାହିଁ। ସରକାରୀ ନିର୍ଦ୍ଦେଶ ପାଳନ କରନ୍ତୁ।",
        "early_warning": "ବନ୍ୟା ପୂର୍ବ ସୂଚନା ବ୍ୟବସ୍ଥା",
        "short_range": "ସ୍ୱଳ୍ପକାଳୀନ ଚେତାବନୀ (୦–୭୨ ଘଣ୍ଟା)",
        "medium_range": "ମଧ୍ୟମ ଅବଧି ନଜର (୩–୭ ଦିନ)",
        "early_outlook": "ବିସ୍ତୃତ ଦୃଷ୍ଟିକୋଣ (୭–୧୪ ଦିନ)",
        "critical_risk": "ଗମ୍ଭୀର ବିପଦ: ତୁରନ୍ତ ବନ୍ୟା ବିପଦ ରହିଛି। ସୁରକ୍ଷିତ ଉଚ୍ଚ ସ୍ଥାନକୁ ଚାଲିଯାଆନ୍ତୁ।",
        "elevated_risk": "ଉଚ୍ଚ ବିପଦ: ଜଳସ୍ତର ବିପଦ ସଂକେତ ପାଖାପାଖି।",
        "moderate_risk": "ମଧ୍ୟମ ବିପଦ: ତଳିଆ ଅଞ୍ଚଳରେ ଜଳବନ୍ଦୀ ହେବା ସମ୍ଭାବନା।",
        "low_risk": "ସ୍ୱାଭାବିକ: କୌଣସି ତତ୍କାଳ ବନ୍ୟା ଆଶଙ୍କା ନାହିଁ।",
        "precaution_1": "ଜଳମଗ୍ନ ରାସ୍ତା କିମ୍ବା ଅଣ୍ଡରପାସ୍ ଦେଇ ଯାତ୍ରା କରନ୍ତୁ ନାହିଁ।",
        "precaution_2": "ପିଇବା ପାଣି, ଜରୁରୀ ଔଷଧ ଏବଂ ଟର୍ଚ୍ଚ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।",
        "precaution_3": "ଘରେ ପାଣି ପଶିଲେ ବିଦ୍ୟୁତ ମୁଖ୍ୟ ସୁଇଚ୍ ବନ୍ଦ କରନ୍ତୁ।",
        "precaution_4": "ଜରୁରୀକାଳୀନ ସହାୟତା ପାଇଁ ୧୧୨ କିମ୍ବା ୧୦୭୦ ରେ ଯୋଗାଯୋଗ କରନ୍ତୁ।",
        "emergency_call": "ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ: ୧୧୨ / ୧୦୭୦",
        "data_gap_warning": "ସୂଚନା: ଏହି ସହରରେ ସ୍ୱତନ୍ତ୍ର ରେନ ଗେଜ୍ ନାହିଁ; ଜିଲ୍ଲା ସ୍ତରୀୟ ତଥ୍ୟ ବ୍ୟବହୃତ ହୋଇଛି।"
    },
    "as": {
        "disclaimer": "অস্বীকাৰোক্তি: ঐতিহাসিক বানৰ তথ্য আৰু বৰষুণৰ পৰিমাণে ভৱিষ্যতৰ বানৰ নিশ্চিত ভৱিষ্যদ্বাণী নকৰে। চৰকাৰী IMD/CWC/ASDMA নিৰ্দেশনা মানি চলক।",
        "early_warning": "বানপানীৰ আগতীয়া সতৰ্কবাণী ব্যৱস্থা",
        "short_range": "হ্ৰস্বম্যাদী সতৰ্কবাণী (০–৭২ ঘণ্টা)",
        "medium_range": "মধ্যমীয়া সময়ৰ নিৰীক্ষণ (৩–৭ দিন)",
        "early_outlook": "দীৰ্ঘম্যাদী পূৰ্বাভাস (৭–১৪ দিন)",
        "critical_risk": "চৰম বিপদ: বানৰ প্ৰত্যক্ষ ভাবুকি আহি পৰিছে। তৎক্ষণাত নিৰাপদ স্থানলৈ যাওক।",
        "elevated_risk": "উচ্চ বিপদ: নদীৰ পানী বিপদসীমাৰ কাষ চাপিছে। সতৰ্ক থাকক।",
        "moderate_risk": "মধ্যমীয়া বিপদ: কিছুমান নিম্ন অঞ্চলত পানী জমা হ'ব পাৰে।",
        "low_risk": "স্বাভাৱিক: তাৎক্ষণিক বানৰ আশংকা নাই।",
        "precaution_1": "পানীত বুৰ যোৱা পথ আৰু কালভাৰ্ট পাৰ নহ'ব।",
        "precaution_2": "বিশুদ্ধ খোৱাপানী, প্ৰয়োজনীয় ঔষধ আৰু টৰ্চ মজুত ৰাখক।",
        "precaution_3": "ঘৰত পানী সোমালে লগে লগে বিদ্যুৎ সংযোগ বন্ধ কৰক।",
        "precaution_4": "জৰুৰীকালীন সাহায্যৰ বাবে ১১২ বা ১০৭০ নম্বৰত ফোন কৰক।",
        "emergency_call": "জৰুৰীকালীন হেল্পলাইন: ১১২ / ১০৭০",
        "data_gap_warning": "টোকাত: এই চহৰত সুকীয়া গেজ নাই; জিলা পৰ্যায়ৰ তথ্য ব্যৱহাৰ কৰা হৈছে।"
    },
    "ur": {
        "disclaimer": "دستبرداری: تاریخی سیلاب کے ریکارڈ اور بارش کے اشارے مستقبل کے سیلاب کی پیش گوئی کی ضمانت نہیں دیتے ہیں۔ سرکاری ہدایات پر عمل کریں۔",
        "early_warning": "سیلاب کی پیشگی وارننگ کا نظام",
        "short_range": "مختصر مدتی وارننگ (0–72 گھنٹے)",
        "medium_range": "درمیانی مدت کی نگرانی (3–7 دن)",
        "early_outlook": "توسیعی آؤٹ لک (7–14 دن)",
        "critical_risk": "شدید خطرہ: فوری سیلاب کا خطرہ ہے۔ محفوظ اور اونچے مقامات پر منتقل ہو جائیں۔",
        "elevated_risk": "بڑھا ہوا خطرہ: پانی کی سطح خطرے کے نشان کے قریب ہے۔ ہوشیار رہیں۔",
        "moderate_risk": "معتدل خطرہ: نشیبی علاقوں میں پانی جمع ہونے کا امکان ہے۔",
        "low_risk": "معمول کے مطابق: فوری سیلاب کا کوئی خطرہ نہیں ہے۔",
        "precaution_1": "پانی میں ڈوبے ہوئے انڈر پاسز یا راستوں سے گاڑیاں نہ نکالیں۔",
        "precaution_2": "پینے کا صاف پانی، ادویات اور بیٹری ٹارچ تیار رکھیں۔",
        "precaution_3": "گھر میں پانی داخل ہونے پر بجلی کا مین سوئچ فوری بند کر دیں۔",
        "precaution_4": "ہنگامی امداد کے لیے 112 یا 1070 پر رابطہ کریں۔",
        "emergency_call": "ہنگامی ہیلپ لائن: 112 / 1070",
        "data_gap_warning": "نوٹ: اس قصبے میں الگ خودکار رین گیج نہیں ہے؛ ضلع کی سطح کا ڈیٹا استعمال کیا گیا ہے۔"
    }
}

class BhashiniService:
    @staticmethod
    def get_supported_languages() -> List[Dict[str, str]]:
        return SUPPORTED_LANGUAGES

    @staticmethod
    async def translate_text(text: str, target_lang: str, source_lang: str = "en") -> Dict[str, Any]:
        """
        Translates text to target language.
        Prioritizes Bhashini NMT API if credentials are provided in .env,
        with seamless zero-latency fallback to built-in verified civil defense dictionary.
        """
        target_lang = target_lang.lower().strip()
        source_lang = source_lang.lower().strip()
        
        if target_lang == source_lang or target_lang == "en":
            return {
                "original_text": text,
                "translated_text": text,
                "target_lang": target_lang,
                "provider": "direct_passthrough",
                "is_cached": True
            }

        # Check built-in translations first for exact phrase matches
        dict_for_lang = BUILTIN_TRANSLATIONS.get(target_lang, {})
        for key, val in dict_for_lang.items():
            if key in text.lower():
                return {
                    "original_text": text,
                    "translated_text": val,
                    "target_lang": target_lang,
                    "provider": "builtin_civil_defense_dictionary",
                    "is_cached": True
                }

        # If Bhashini API key is configured, call Bhashini Neural Machine Translation API
        if BHASHINI_API_KEY and BHASHINI_USER_ID:
            try:
                headers = {
                    "Authorization": BHASHINI_API_KEY,
                    "Content-Type": "application/json",
                    "userID": BHASHINI_USER_ID,
                    "ulcaApiKey": BHASHINI_API_KEY
                }
                payload = {
                    "pipelineTasks": [
                        {
                            "taskType": "translation",
                            "config": {
                                "language": {
                                    "sourceLanguage": source_lang,
                                    "targetLanguage": target_lang
                                }
                            }
                        }
                    ],
                    "inputData": {
                        "input": [{"source": text}]
                    }
                }
                
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.post(BHASHINI_ENDPOINT, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        translated = (
                            data.get("pipelineResponse", [{}])[0]
                            .get("output", [{}])[0]
                            .get("target", "")
                        )
                        if translated:
                            return {
                                "original_text": text,
                                "translated_text": translated,
                                "target_lang": target_lang,
                                "provider": "bhashini_nmt_api",
                                "is_cached": False
                            }
            except Exception as e:
                logger.warning(f"Bhashini API call failed: {e}. Falling back to internal dictionary.")

        # Fallback to dictionary translation or safety notice in target script
        disclaimer = dict_for_lang.get("disclaimer", text)
        return {
            "original_text": text,
            "translated_text": disclaimer if len(text) > 40 else text,
            "target_lang": target_lang,
            "provider": "builtin_dictionary_fallback",
            "is_cached": True
        }

    @staticmethod
    def get_localized_safety_bulletin(risk_level: str, lang: str = "en") -> Dict[str, Any]:
        """Provides instant verified civil defense instructions in target language."""
        lang = lang.lower().strip()
        dict_data = BUILTIN_TRANSLATIONS.get(lang, BUILTIN_TRANSLATIONS.get("hi", {}))
        
        risk_key = f"{risk_level.lower()}_risk"
        risk_msg = dict_data.get(risk_key, f"Risk Level: {risk_level}")
        
        precautions = [
            dict_data.get("precaution_1", "Avoid driving through flooded underpasses and arterial crossings."),
            dict_data.get("precaution_2", "Keep emergency drinking water, medication, and flashlights accessible."),
            dict_data.get("precaution_3", "Disconnect main electrical power if water inundates compound."),
            dict_data.get("precaution_4", "Call emergency authorities at 112 or 1070 for evacuation support.")
        ]
        
        return {
            "risk_assessment": risk_msg,
            "precautions": precautions,
            "emergency_contacts": dict_data.get("emergency_call", "Emergency Helpline: 112 / 1070"),
            "disclaimer": dict_data.get("disclaimer", "Historical flood records do not guarantee future flood forecasts.")
        }
