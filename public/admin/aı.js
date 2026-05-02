// ╔══════════════════════════════════════════════════════════════════════════╗
// ║           MZ CV PARSER v3.0 — ULTRA GÜCLÜ & TAM VERSİYA               ║
// ║           © MZ Recruitment — Bütün hüquqlar qorunur                    ║
// ╚══════════════════════════════════════════════════════════════════════════╝

"use strict";

// ══════════════════════════════════════════════════════════════════════════════
//  ANA FUNKSIYA — runAIParse
// ══════════════════════════════════════════════════════════════════════════════

async function runAIParse() {
  const textarea = document.getElementById('ai-cv-text');
  const rawText  = textarea ? textarea.value.trim() : '';

  if (!rawText) {
    showToast('❌ Zəhmət olmasa CV mətnini yapışdırın!', 'error');
    return;
  }

  const loading  = document.getElementById('ai-loading');
  const parseBtn = document.getElementById('ai-parse-btn');
  const modelRow = document.getElementById('ai-model-row');

  // UI: yükləmə vəziyyəti
  if (loading)  loading.classList.add('visible');
  if (parseBtn) parseBtn.disabled = true;
  if (textarea) textarea.style.display = 'none';
  if (modelRow) modelRow.style.display = 'none';

  await new Promise(r => setTimeout(r, 350));

  try {
    const result = deepParseCV(rawText);
    applyToForm(result);

    const filledCount = Object.values(result).filter(v =>
      v && (typeof v === 'string' ? v.trim() : (Array.isArray(v) ? v.length > 0 : true))
    ).length;

    showToast(`✅ CV uğurla analiz edildi! ${filledCount} sahə dolduruldu.`, 'success');
  } catch (err) {
    console.error('[MZ CV Parser] Parse xətası:', err);
    showToast('❌ Parse xətası: ' + (err.message || 'Naməlum xəta'), 'error');
  } finally {
    if (loading)  loading.classList.remove('visible');
    if (parseBtn) parseBtn.disabled = false;
    if (textarea) textarea.style.display = '';
    if (modelRow) modelRow.style.display = '';
    closeAIModal();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  ƏSAS PARSE FUNKSİYASI
// ══════════════════════════════════════════════════════════════════════════════

function deepParseCV(raw) {
  if (!raw || typeof raw !== 'string') return {};

  const result   = {};
  const lines    = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const textOrig = raw;
  const textLow  = raw.toLowerCase();

  // ── 1. AD SOYAD
  result.name = parseName(lines, textOrig);

  // ── 2. DOĞUM TARİXİ
  result.dob = parseDOB(textOrig);

  // ── 3. CİNS
  result.gender = parseGender(textLow);

  // ── 4. VƏTƏNDAŞLIQ
  result.nationality = parseNationality(textLow);

  // ── 5. ŞƏHƏRi / ÖLKƏ
  result.location = parseLocation(textOrig, textLow);

  // ── 6. SAHƏ
  result.field = parseField(textLow);

  // ── 7. KANDİDAT NÖVÜ
  result.type = parseType(textLow);

  // ── 8. ALMAN DİLİ SƏVİYYƏSİ
  result.delevel = parseDeutschLevel(textOrig, textLow);

  // ── 9. VİZA
  result.visa = parseVisa(textLow);

  // ── 10. TƏHSİL
  const edu        = parseEducation(textOrig, textLow, lines);
  result.eduLevel  = edu.level;
  result.eduSchool = edu.school;
  result.eduMajor  = edu.major;
  result.eduYears  = edu.years;

  // ── 11. İŞ TƏCRÜBƏSİ
  result.experiences = parseExperiences(textOrig, lines);

  // ── 12. BACARIQLAR (Kernkompetenzen)
  result.skills = parseSkills(textOrig, lines);

  // ── 13. KOMPÜTER BİLİKLƏRİ
  result.computerSkills = parseComputerSkills(textOrig, lines);

  // ── 14. ƏLAVƏ BACARIQLAR
  result.additionalSkills = parseAdditionalSkills(textOrig, lines);

  // ── 15. SERTİFİKATLAR
  result.certifications = parseCertifications(textOrig, lines);

  // ── 16. DİLLƏR
  result.langs = parseLanguages(textOrig, lines);

  // ── 17. ƏLAQƏ
  result.email    = parseEmail(textOrig);
  result.phone    = parsePhone(textOrig);
  result.whatsapp = parseWhatsApp(textOrig);
  result.linkedin = parseLinkedIn(textOrig);
  result.website  = parseWebsite(textOrig);

  // ── 18. MAAŞ & MÖVCUDLUq
  result.salary        = parseSalary(textOrig);
  result.availableFrom = parseAvailability(textLow);
  result.workType      = parseWorkType(textLow);
  result.relocation    = parseRelocation(textLow);

  // ── 19. STATUS & PRİORİTET
  result.status   = 'available';
  result.priority = /sofort|immediately|dərhal|ab sofort/i.test(textOrig) ? 'high' : 'normal';

  // ── 20. QISA CV (Tagline)
  const taglines   = parseTaglines(textOrig, lines, result);
  result.taglineDE = taglines.de;
  result.taglineAZ = taglines.az;
  result.taglineEN = taglines.en;

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
//  PARSE ALT-FUNKSİYALARI
// ══════════════════════════════════════════════════════════════════════════════

// ── AD SOYAD ──────────────────────────────────────────────────────────────────
function parseName(lines, textOrig) {
  // 1) Etiketli format: "Name: Farid Akhundov"
  const labelMatch = textOrig.match(
    /(?:^|\n)\s*(?:name|ad\s*(?:soyad)?|full\s*name|vor-?\s*und\s*nachname|isim\s*soyisim)\s*[:\-]\s*([^\n]{3,60})/im
  );
  if (labelMatch) return labelMatch[1].trim();

  // 2) İlk 8 sətirdə — 2-5 sözdən ibarət, hər söz böyük hərflə başlayan
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i];
    if (line.length > 65 || line.length < 4) continue;
    if (/[0-9@#\|\/\\<>{}\(\)\+]/.test(line)) continue;
    if (/profil|lebenslauf|curriculum|vitae|\bcv\b|resume|bewerbung|zusammenfassung/i.test(line)) continue;

    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const allCapitalized = words.every(w =>
        /^[A-ZÄÖÜÉÀÈÂÊÎÔÛÇÑĞŞƏÏ][a-zA-ZäöüÄÖÜéàèâêîôûçñğşəïİı'\-]{1,}$/.test(w)
      );
      if (allCapitalized) return line.trim();
    }
  }

  // 3) İlk sətirdə böyük hərflə yazılmış — ALL CAPS ad
  const firstFew = lines.slice(0, 5).join('\n');
  const allCaps  = firstFew.match(/^([A-ZÄÖÜĞŞƏÇI]{2,}\s+[A-ZÄÖÜĞŞƏÇI]{2,}(?:\s+[A-ZÄÖÜĞŞƏÇI]{2,})?)\s*$/m);
  if (allCaps) {
    return allCaps[1].trim().split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // 4) Regex ilə — böyük hərflə başlayan 2 söz, ilk sətirdə
  const regexMatch = textOrig.match(
    /^([A-ZÄÖÜĞŞƏÇI][a-zäöüğşəçiıİ]+(?:\s+[A-ZÄÖÜĞŞƏÇI][a-zäöüğşəçiıİ]+){1,3})/m
  );
  if (regexMatch) return regexMatch[1].trim();

  return '';
}

// ── DOĞUM TARİXİ ──────────────────────────────────────────────────────────────
function parseDOB(text) {
  // Etiketli format
  const labeled = text.match(
    /(?:geburtsdatum|doğum\s*(?:tarixi|t\.)?|born|date\s*of\s*birth|d\.o\.b\.?|birthday)\s*[:\-]?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4})/i
  );
  if (labeled) return normalizeDOB(labeled[1]);

  // Ay adı ilə: "15 März 1990", "March 15, 1990"
  const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december|' +
    'januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember';
  const monthMatch = text.match(
    new RegExp(`(\\d{1,2})[.\\s]+(${monthNames})[.\\s]+(\\d{4})`, 'i')
  );
  if (monthMatch) {
    const monthMap = {
      january:1, february:2, march:3, april:4, may:5, june:6,
      july:7, august:8, september:9, october:10, november:11, december:12,
      januar:1, februar:2, märz:3, mai:5, juni:6, juli:7,
      august:8, oktober:10, dezember:12
    };
    const m = monthMap[monthMatch[2].toLowerCase()] || 1;
    return monthMatch[1].padStart(2,'0') + '.' + String(m).padStart(2,'0') + '.' + monthMatch[3];
  }

  // Sadə tarix formatı (1940-2010 arasında)
  const plain = text.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](19[4-9]\d|200[0-9]|201[0-5])\b/);
  if (plain) return plain[1].padStart(2,'0') + '.' + plain[2].padStart(2,'0') + '.' + plain[3];

  return '';
}

function normalizeDOB(str) {
  const parts = str.split(/[.\/-]/);
  if (parts.length !== 3) return str;
  if (parts[2].length === 4) {
    return parts[0].padStart(2,'0') + '.' + parts[1].padStart(2,'0') + '.' + parts[2];
  }
  if (parts[0].length === 4) {
    return parts[2].padStart(2,'0') + '.' + parts[1].padStart(2,'0') + '.' + parts[0];
  }
  return str;
}

// ── CİNS ──────────────────────────────────────────────────────────────────────
function parseGender(textLow) {
  if (/\b(herr\b|mr\.?|männlich|male|kişi|erkek|bay\b|bey\b)\b/.test(textLow)) return 'male';
  if (/\b(frau\b|ms\.?|mrs\.?|weiblich|female|qadın|kadın|bayan)\b/.test(textLow)) return 'female';
  return '';
}

// ── VƏTƏNDAŞLIQ ───────────────────────────────────────────────────────────────
function parseNationality(textLow) {
  const map = [
    [/aserbaidschanisch|azerbaijani|azərbaycanlı|azerbaycanli|azerbaijaner/,       'Azərbaycan'],
    [/türkisch|turkish|türk\b/,                                                    'Türkiyə'],
    [/\bdeutsch\b|german|alman/,                                                   'Almaniya'],
    [/russisch|russian|rus\b/,                                                     'Rusiya'],
    [/ukrainisch|ukrainian|ukrayna/,                                               'Ukrayna'],
    [/georgisch|georgian|gürcü/,                                                   'Gürcüstan'],
    [/österreichisch|austrian|avstriyal/,                                          'Avstriya'],
    [/schweizerisch|swiss|isveçrəl/,                                               'İsveçrə'],
    [/polnisch|polish|polyak/,                                                     'Polşa'],
    [/rumänisch|romanian/,                                                         'Rumıniya'],
    [/bulgarisch|bulgarian/,                                                       'Bolqarıstan'],
    [/kasachisch|kazakh|qazax/,                                                    'Qazaxıstan'],
    [/usbekisch|uzbek|özbək/,                                                      'Özbəkistan'],
    [/armenisch|armenian|erməni/,                                                  'Ermənistan'],
    [/iranisch|persian|irani/,                                                     'İran'],
    [/britisch|british|english/,                                                   'Böyük Britaniya'],
    [/amerikanisch|american/,                                                      'ABŞ'],
    [/chinesisch|chinese/,                                                         'Çin'],
    [/japanisch|japanese/,                                                         'Yaponiya'],
    [/pakistanisch|pakistani/,                                                     'Pakistan'],
    [/indisch|indian/,                                                             'Hindistan'],
  ];
  for (const [re, val] of map) {
    if (re.test(textLow)) return val;
  }
  return '';
}

// ── ŞƏHƏRi / ÖLKƏ ─────────────────────────────────────────────────────────────
function parseLocation(textOrig, textLow) {
  // Etiketli format
  const labeled = textOrig.match(
    /(?:wohnort|adresse|address|şəhər|city|location|standort|wohnsitz|ort)\s*[:\-]\s*([^\n,]{3,60})/i
  );
  if (labeled) return labeled[1].trim();

  // Poçt kodu + şəhər: "10115 Berlin", "1010 Wien"
  const postalCity = textOrig.match(/\b(\d{4,5})\s+([A-ZÄÖÜ][a-zäöü]+(?:[\s-][A-ZÄÖÜ]?[a-zäöü]+)?)\b/);
  if (postalCity) {
    const city = postalCity[2];
    const countryMap = getCityCountryMap();
    const key = city.toLowerCase();
    return countryMap[key] || city;
  }

  // Məlum şəhərlər
  const countryMap = getCityCountryMap();
  for (const [city, label] of Object.entries(countryMap)) {
    const re = new RegExp('\\b' + city + '\\b', 'i');
    if (re.test(textLow)) return label;
  }
  return '';
}

function getCityCountryMap() {
  return {
    'istanbul': 'Istanbul, Türkiye',
    'ankara': 'Ankara, Türkiye',
    'izmir': 'İzmir, Türkiye',
    'bursa': 'Bursa, Türkiye',
    'antalya': 'Antalya, Türkiye',
    'baku': 'Bakı, Azərbaycan',
    'bakı': 'Bakı, Azərbaycan',
    'ganja': 'Gəncə, Azərbaycan',
    'sumqayit': 'Sumqayıt, Azərbaycan',
    'berlin': 'Berlin, Deutschland',
    'münchen': 'München, Deutschland',
    'hamburg': 'Hamburg, Deutschland',
    'frankfurt': 'Frankfurt, Deutschland',
    'köln': 'Köln, Deutschland',
    'düsseldorf': 'Düsseldorf, Deutschland',
    'stuttgart': 'Stuttgart, Deutschland',
    'leipzig': 'Leipzig, Deutschland',
    'dresden': 'Dresden, Deutschland',
    'nürnberg': 'Nürnberg, Deutschland',
    'hannover': 'Hannover, Deutschland',
    'bremen': 'Bremen, Deutschland',
    'dortmund': 'Dortmund, Deutschland',
    'essen': 'Essen, Deutschland',
    'bochum': 'Bochum, Deutschland',
    'mannheim': 'Mannheim, Deutschland',
    'karlsruhe': 'Karlsruhe, Deutschland',
    'augsburg': 'Augsburg, Deutschland',
    'wien': 'Wien, Österreich',
    'graz': 'Graz, Österreich',
    'salzburg': 'Salzburg, Österreich',
    'linz': 'Linz, Österreich',
    'zürich': 'Zürich, Schweiz',
    'genf': 'Genf, Schweiz',
    'basel': 'Basel, Schweiz',
    'bern': 'Bern, Schweiz',
    'london': 'London, UK',
    'paris': 'Paris, Frankreich',
    'amsterdam': 'Amsterdam, Niederlande',
    'brüssel': 'Brüssel, Belgien',
    'madrid': 'Madrid, İspaniya',
    'barcelona': 'Barcelona, İspaniya',
    'rom': 'Roma, İtaliya',
    'mailand': 'Milano, İtaliya',
    'moskau': 'Moskva, Rusiya',
    'sankt petersburg': 'Sankt-Peterburq, Rusiya',
    'kiew': 'Kiyev, Ukrayna',
    'tbilisi': 'Tbilisi, Gürcüstan',
    'almaty': 'Almatı, Qazaxıstan',
    'taschkent': 'Daşkənd, Özbəkistan',
    'dubai': 'Dubay, BƏƏ',
    'abu dhabi': 'Əbu-Dabi, BƏƏ',
  };
}

// ── SAHƏ ──────────────────────────────────────────────────────────────────────
function parseField(textLow) {
  const rules = [
    // Digital / SMM / Marketing
    [/social\s*media\s*manag|smm\b|content\s*creator|content\s*specialist|instagram.*manag|tiktok.*manag|reels.*creator/,  'SocialMedia'],
    [/performance\s*marketing|google\s*ads|meta\s*ads|facebook\s*ads|sem\b|pay\s*per\s*click|ppc\b/,                        'Marketing'],
    [/seo\s*spezial|seo\s*expert|suchmaschinenoptimier/,                                                                     'Marketing'],
    [/marketing\s*manag|marketing\s*spezial|digital\s*marketing|online\s*marketing/,                                        'Marketing'],
    [/brand\s*manag|branding.*exper|markenaufbau/,                                                                           'Marketing'],
    // Satış / CRM
    [/vertrieb.*spezial|sales.*manag|crm.*spezial|kundenakquise|verkaufsleiter|sales\s*director/,                           'Verkauf'],
    [/\bvertrieb\b|\bsales\b|\bverkauf\b/,                                                                                   'Verkauf'],
    // Tibb
    [/pflege.*fachkraft|krankenpfleger|krankenschwester|altenpfleger|pflegefachmann|pflegefachfrau/,                        'Pflege'],
    [/\barzt\b|\bärztin\b|mediziner|chirurg|internist|allgemeinmedizin/,                                                    'Arzt'],
    [/zahnarzt|zahnärztin|\bdental\b|kieferorthopädie/,                                                                     'Zahnarzt'],
    [/apothek/,                                                                                                              'Apotheke'],
    [/physiotherap/,                                                                                                         'Physiotherapie'],
    [/\bpsycholog/,                                                                                                          'Psychologie'],
    [/hebamme|entbindung/,                                                                                                   'Pflege'],
    [/ergotherap/,                                                                                                           'Physiotherapie'],
    // IT
    [/software.*develop|web.*develop|full.?stack|frontend.*develop|backend.*develop|mobile.*develop/,                       'IT'],
    [/ios.*develop|android.*develop|flutter|react\s*native/,                                                                'IT'],
    [/it.*manag|system.*admin|netzwerk.*admin|network.*admin/,                                                               'Netzwerk'],
    [/data.*scientist|machine\s*learning|deep\s*learning|ki\b.*spezial|\bai\b.*expert|nlp\b/,                              'DataScience'],
    [/ui.?ux|user\s*interface|user\s*experience|graphic.*design|webdesig/,                                                  'Design'],
    [/it.*support|helpdesk|it.*techniker|it.*spezialist/,                                                                   'ITSupport'],
    [/cyber.*security|informationssicherheit|penetration.*test/,                                                             'Netzwerk'],
    [/devops|cloud.*architect|kubernetes|docker\s*exper/,                                                                   'IT'],
    [/\bit\b|informatik|\bsoftware\b|\bdeveloper\b|\bcoding\b|\bprogrammier/,                                              'IT'],
    // Hotel / Turizm
    [/hotel.*manag|hotelfachmann|hotelfachfrau|rezeptionist|front.*office.*manag/,                                          'Hotel'],
    [/revenue\s*manag.*hotel|yield\s*manag/,                                                                                'Hotel'],
    [/tourismus|reisebüro|travel\s*agent|travel\s*manag/,                                                                   'Tourismus'],
    [/event.*manag|veranstaltung.*manag|kongress.*manag/,                                                                   'Eventmanagement'],
    [/housekeeping|zimmer.*service|roomkeeper/,                                                                              'Housekeeping'],
    // Qida / Restoran
    [/küchenchef|chefkoch|sous.*chef|executive.*chef/,                                                                      'Koch'],
    [/bäcker|bäckerei|bäckergesell/,                                                                                        'Baecker'],
    [/konditor|patissier|zuckerbäcker/,                                                                                     'Konditor'],
    [/kellner|servicekraft|restaurant.*service|gastronom.*fachkraft/,                                                       'Kellner'],
    [/barista|kaffeebar|coffee.*spezial/,                                                                                    'Barista'],
    [/\bcatering\b/,                                                                                                         'Catering'],
    [/gastronomie|restaurant.*manag|küchenpersonal|gastro/,                                                                 'Gastronomie'],
    // Logistik / Transport
    [/lkw.*fahrer|berufskraftfahrer|trucker|c\+e.*fahrer/,                                                                  'Fahrer'],
    [/lagerlogistik|lagerarbeiter|lager.*mitarbeiter|warehouse.*work/,                                                      'Lager'],
    [/logistik.*manag|supply.*chain.*manag/,                                                                                 'Logistik'],
    [/spedition|speditionskaufmann/,                                                                                         'Spedition'],
    [/gabelstapler.*fahrer|stapler.*fahrer/,                                                                                 'Gabelstapler'],
    [/\blogistik\b|\blager\b|\bwarehouse\b/,                                                                                'Logistik'],
    // Tikinti / Texniki
    [/elektriker|elektroinstallateur|elektrofachkraft/,                                                                     'Elektrik'],
    [/sanitär|klempner|installateur.*sanit/,                                                                                'Sanitaer'],
    [/schreiner|tischler|möbelbau|holzfacharbeiter/,                                                                        'Schreiner'],
    [/schweißer|schweisser|schweißfachmann/,                                                                                'Schweisser'],
    [/maler.*lackierer|lackierer.*maler/,                                                                                   'Maler'],
    [/dachdecker/,                                                                                                           'Dachdecker'],
    [/kfz.*mechatroniker|kfz.*mechaniker|automechaniker|fahrzeugtechniker/,                                                 'Kfz'],
    [/maschinenbauer|maschinenbau.*ingenieur/,                                                                               'Maschinenbau'],
    [/\bhandwerker\b|\bhandwerk\b/,                                                                                         'Handwerk'],
    [/bauingenieur|bauleiter|bautechniker|bauprojektmanager/,                                                               'Bau'],
    [/innenarchitekt|raumplaner/,                                                                                            'Design'],
    // Ofis / Maliyyə
    [/buchhalter|buchhaltung|finanzbuchhalter|bilanzbuchhalter/,                                                            'Buchhaltung'],
    [/\bcontroller\b|\bcontrolling\b/,                                                                                      'Controlling'],
    [/personalreferent|hr.*manag|human.*resources|recruiting.*spezial/,                                                     'Personalwesen'],
    [/rechtsanwalt|jurist|rechtswissenschaft|anwalt/,                                                                       'Recht'],
    [/steuerberater|steuerfachmann|steuerrecht/,                                                                            'Steuer'],
    [/bürokaufmann|bürokauffrau|sekretär|sekretärin|verwaltungsangest/,                                                     'Büro'],
    [/project.*manag|projektmanager|projektleiter/,                                                                         'Management'],
    [/geschäftsführer|ceo\b|coo\b|cfo\b|vorstand/,                                                                         'Management'],
    // Mühəndis
    [/elektrotechniker|elektroingenieur/,                                                                                   'Elektronik'],
    [/chemiker|chemieingenieur|verfahrenstechniker/,                                                                        'Chemie'],
    [/umweltingenieur|umwelttechniker/,                                                                                     'Umwelt'],
    [/luft.*raumfahrt|aerospace/,                                                                                           'Luft'],
    [/\bingenieur\b|\bengineer\b/,                                                                                          'Mühəndis'],
    // Təhsil
    [/\blehrer\b|\blehrerin\b|pädagoge|lehrkraft/,                                                                         'Lehrer'],
    [/erzieher|erzieherin|kindergärtnerin/,                                                                                 'Erziehung'],
    [/sozialarbeiter|sozialpädagoge|jugendarbeiter/,                                                                        'Sozialarbeit'],
    [/übersetzer|dolmetscher|translator|lokalisierung/,                                                                     'Übersetzer'],
    [/wissenschaftler|forscher|researcher/,                                                                                  'Wissenschaft'],
    // Media / PR
    [/redakteur|moderator|journalist|tv.*moderator|nachrichtensprecher/,                                                    'PR'],
    [/pr.*manag|öffentlichkeitsarbeit|pressesprecher/,                                                                      'PR'],
    [/fotograf|videograf|kameramann/,                                                                                        'Media'],
    // Digər
    [/sicherheitsdienst|wachmann|security\s*guard/,                                                                         'Sicherheit'],
    [/reinigungskraft|gebäudereiniger|facility.*management/,                                                                'Reinigung'],
    [/friseur|frisörin|kosmetiker|stylist/,                                                                                 'Friseur'],
    [/landwirt|bauer|agrar|farm.*manag/,                                                                                    'Landwirtschaft'],
    [/energietechniker|energieberater/,                                                                                      'Energie'],
    [/tierarzt|veterinär/,                                                                                                   'Veteriner'],
    [/apotheker|pharmazeut/,                                                                                                 'Apotheke'],
    [/fitnesstrainer|personaltrainer|sportlehrer/,                                                                          'Sport'],
    [/pilot\b|kabinenpersonal|flugbegleiter/,                                                                               'Luft'],
    [/immobilienmakler|immobilienmanager/,                                                                                   'Immobilien'],
    [/kundenservice|kundenbetreuer|kundendienst/,                                                                           'Kundenservice'],
  ];

  for (const [re, field] of rules) {
    if (re.test(textLow)) return field;
  }
  return 'Andere';
}

// ── KANDİDAT NÖVÜ ─────────────────────────────────────────────────────────────
function parseType(textLow) {
  if (/ausbildung|azubi|lehrling|apprentice|stajyer|berufsausbildung/.test(textLow)) return 'ausbildung';
  if (/praktikum|intern\b|werkstudent|student.*job/.test(textLow)) return 'praktikum';
  if (/saisonal|seasonal|mövsüm|saisonarbeit|ernte/.test(textLow)) return 'saisonal';
  return 'fachkraft';
}

// ── ALMAN DİLİ SƏVİYYƏSİ ─────────────────────────────────────────────────────
function parseDeutschLevel(textOrig, textLow) {
  // Birbaşa səviyyə: "Deutsch – B2", "Deutsch: C1"
  const direct = textOrig.match(/deutsch\s*[-–:]\s*(A1|A2|B1|B2|C1|C2)\b/i);
  if (direct) return direct[1].toUpperCase();

  // Sertifikat adı ilə: "Goethe-Zertifikat B2"
  const cert = textOrig.match(/(?:goethe|telc|ösd|testdaf|dsh)\s*[-–]?\s*(?:zertifikat\s*)?(A1|A2|B1|B2|C1|C2)\b/i);
  if (cert) return cert[1].toUpperCase();

  // Açıqlama ilə
  const descMap = [
    [/deutsch.*?muttersprache|deutsch.*?native|deutsch.*?muttersprachler/i, 'C2'],
    [/deutsch.*?c2|deutsch.*?sehr\s+gut\s+in\s+wort/i,                     'C2'],
    [/deutsch.*?verhandlungssicher|deutsch.*?fließend/i,                    'C1'],
    [/deutsch.*?c1|deutsch.*?sehr\s+gut\b/i,                               'C1'],
    [/deutsch.*?gute?\s+kenntnisse|deutsch.*?fortgeschritten/i,             'B2'],
    [/deutsch.*?b2|deutsch.*?gut\b/i,                                      'B2'],
    [/deutsch.*?mittelstufe|deutsch.*?mittel\b/i,                           'B1'],
    [/deutsch.*?b1/i,                                                       'B1'],
    [/deutsch.*?grundkenntnisse|deutsch.*?grundlagen/i,                     'A2'],
    [/deutsch.*?a2/i,                                                       'A2'],
    [/deutsch.*?anfänger|deutsch.*?a1\b/i,                                  'A1'],
  ];

  for (const [re, level] of descMap) {
    if (re.test(textOrig)) return level;
  }

  // Dil bölməsindən axtar
  const langSection = extractSectionText(textOrig, [
    'sprachkenntnisse', 'sprachen', 'languages', 'dillər', 'fremdsprachen'
  ]);
  if (langSection) {
    const inSection = langSection.match(/deutsch\s*[-–:]\s*(A1|A2|B1|B2|C1|C2)/i);
    if (inSection) return inSection[1].toUpperCase();

    const descInSection = langSection.match(/deutsch\s*[-–:]?\s*([a-züäöÄÖÜ\s]+)/i);
    if (descInSection) {
      for (const [re, level] of descMap) {
        if (re.test('deutsch ' + descInSection[1])) return level;
      }
    }
  }

  return '';
}

// ── VİZA ──────────────────────────────────────────────────────────────────────
function parseVisa(textLow) {
  if (/\beu.?bürger\b|eu\s*citizen|eu-staatsbürger/.test(textLow))            return 'eu';
  if (/arbeitserlaubnis|work\s*permit|iş\s*icazəsi|arbeitsgenehmigung/.test(textLow)) return 'de_work';
  if (/aufenthaltstitel|niederlassungserlaubnis/.test(textLow))                 return 'de_residence';
  if (/schengen/.test(textLow))                                                 return 'schengen';
  if (/visum\s*beantragt|visa\s*applied|müraciət\s*edildi/.test(textLow))      return 'applied';
  if (/kein\s*visum|no\s*visa\s*required/.test(textLow))                       return 'none_needed';
  return '';
}

// ── TƏHSİL ────────────────────────────────────────────────────────────────────
function parseEducation(textOrig, textLow, lines) {
  const edu = { level: '', school: '', major: '', years: '' };

  // Səviyyə müəyyənləşdir
  if (/promotion|ph\.?d\.?|doktorat|doktorand|dr\.\s/i.test(textOrig))           edu.level = 'phd';
  else if (/\bmaster\b|magistr|mba\b|m\.sc\.?|m\.a\.\b|master.*abschluss/i.test(textOrig)) edu.level = 'master';
  else if (/bachelor|bakalavr|b\.sc\.?|b\.a\.\b|bachelorarbeit/i.test(textOrig)) edu.level = 'bachelor';
  else if (/ausbildung|berufsschule|peşə\s*məktəbi|vocational|azubi\b|lehrling/i.test(textOrig)) edu.level = 'vocational';
  else if (/abitur|gymnasium|lise\b|orta\s*məktəb|high\s*school|matura\b/i.test(textOrig)) edu.level = 'secondary';
  else if (/fachhochschule|fh\b|university\s*of\s*applied/i.test(textOrig))      edu.level = 'bachelor';

  // Bölməni tap
  const eduSection = extractSectionText(textOrig, [
    'ausbildung', 'bildung', 'studium', 'education', 'qualifikation',
    'akademische', 'schulbildung', 'təhsil', 'university', 'akademik'
  ]);

  const searchText = eduSection || textOrig;

  // Universitet / məktəb adı
  const uniPatterns = [
    /([A-ZÄÖÜ][a-zäöüəğışçöüñ\-\s]+(?:universität|university|hochschule|institut|akademie|college|fachhochschule)(?:\s+[A-ZÄÖÜ][a-zäöüəğışçöüñ\-\s]+)?)/i,
    /(?:universität|university|hochschule|fachhochschule|institute?|academy)\s+((?:of\s+)?[A-ZÄÖÜ][a-zäöüəğışçöüñ\-\s,]+?)(?:\n|,|\.|–|-|\d)/i,
    /(?:technische\s+universität|tu\s+)[A-ZÄÖÜ][a-zäöü]+/i,
  ];
  for (const pat of uniPatterns) {
    const m = searchText.match(pat);
    if (m) {
      edu.school = m[0].trim().split('\n')[0].substring(0, 80);
      break;
    }
  }

  // İxtisas
  const majorPatterns = [
    /(?:studiengang|fachrichtung|major|ixtisas|fakultät|studienrichtung)\s*[:\-]?\s*([^\n,]{5,70})/i,
    /(?:bachelor|master|promotion|studium)\s+(?:in|of|der|des|im|of)\s+([A-ZÄÖÜ][a-zäöüəğışçöüñ\s\-]+?)(?:\n|,|\.|\d)/i,
    /(?:abschluss\s+in|degree\s+in)\s+([A-ZÄÖÜ][a-zäöü\s]+)/i,
  ];
  for (const pat of majorPatterns) {
    const m = searchText.match(pat);
    if (m) {
      edu.major = m[1].trim().substring(0, 70);
      break;
    }
  }

  // İllər — ən son tapılan
  const allYears = [];
  const yearRe = /(\d{2}\/\d{4}|\d{4})\s*[-–bis]+\s*(\d{2}\/\d{4}|\d{4})/g;
  let m;
  const searchIn = eduSection || '';
  while ((m = yearRe.exec(searchIn)) !== null) {
    allYears.push(m[1] + '–' + m[2]);
  }
  if (allYears.length > 0) edu.years = allYears[allYears.length - 1];

  return edu;
}

// ── İŞ TƏCRÜBƏSİ ──────────────────────────────────────────────────────────────
function parseExperiences(textOrig, lines) {
  const experiences = [];

  // Tarix pattern-ləri
  const dateRe = /(\d{2}\/\d{4}|\d{4}|\d{1,2}\.\d{4})\s*[-–\/]\s*(\d{2}\/\d{4}|\d{4}|\d{1,2}\.\d{4}|heute|present|now|indiyədək|aktuell|bis\s*heute|current|laufend)/i;

  const seenDates = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRe);

    if (!dateMatch) continue;

    const dateStr = dateMatch[0].trim();
    if (seenDates.has(dateStr)) continue;
    seenDates.add(dateStr);

    // Başlığı tap — tarix çıxarılmış hal
    const titleInLine = line.replace(dateStr, '').replace(/^\s*[-–|:,]\s*/, '').trim();
    let title   = '';
    let company = '';

    if (titleInLine.length > 3 && titleInLine.length < 120) {
      title = titleInLine;
    } else if (i > 0 && lines[i-1].length >= 3 && lines[i-1].length < 120) {
      title = lines[i-1];
    } else if (i + 1 < lines.length && !dateRe.test(lines[i+1]) && lines[i+1].length > 3) {
      title = lines[i+1];
    }

    // Şirkət adını sonrakı sətirdə axtar
    const nextLine = lines[i + 1] || '';
    const nextNext = lines[i + 2] || '';
    if (!dateRe.test(nextLine) && nextLine.length > 2 && nextLine.length < 90 && nextLine !== title) {
      company = nextLine;
    } else if (!dateRe.test(nextNext) && nextNext.length > 2 && nextNext.length < 90 && nextNext !== title) {
      company = nextNext;
    }

    let fullTitle = title;
    if (company && !title.toLowerCase().includes(company.toLowerCase())) {
      fullTitle = title + (title ? ' @ ' : '') + company;
    }

    if (fullTitle.length > 2) {
      experiences.push({
        title: fullTitle.substring(0, 130),
        year: dateStr
      });
    }
  }

  // Bölmədən çıxar — əgər tarix tapılmadısa
  if (experiences.length === 0) {
    const expSection = extractSectionText(textOrig, [
      'berufserfahrung', 'berufliche erfahrung', 'work experience',
      'iş təcrübəsi', 'erfahrung', 'tätigkeiten', 'beruflicher werdegang',
      'professional experience', 'employment history'
    ]);

    if (expSection) {
      const expLines = expSection.split('\n').map(l => l.trim()).filter(Boolean);
      for (const eLine of expLines) {
        if (eLine.length > 5 && eLine.length < 120 && !/^[•\-\*]/.test(eLine)) {
          experiences.push({ title: eLine, year: '' });
          if (experiences.length >= 10) break;
        }
      }
    }
  }

  return experiences.slice(0, 10);
}

// ── BACARIQLAR ────────────────────────────────────────────────────────────────
function parseSkills(textOrig, lines) {
  const skills = [];

  const sectionNames = [
    'kernkompetenzen', 'kompetenzen', 'fähigkeiten', 'skills',
    'bacarıqlar', 'qualifikationen', 'stärken', 'kenntnisse',
    'schlüsselkompetenzen', 'soft skills', 'hard skills', 'berufliche kompetenzen'
  ];

  const section = extractSectionText(textOrig, sectionNames);

  if (section) {
    const sLines = section.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of sLines) {
      const cleaned = line.replace(/^[\u2022\-\*\u2713\u25BA\u25AA\u2192\u2714\u25CF\u25B8]\s*/, '').trim();
      if (cleaned.length > 2 && cleaned.length < 80) {
        cleaned.split(/[,;]/).forEach(p => {
          const s = p.trim();
          if (s.length > 2 && !skills.includes(s)) skills.push(s);
        });
      }
    }
  }

  // Ümumi açar sözlər — fallback
  if (skills.length < 3) {
    const generalSkills = [
      'Social Media Management', 'Content Creation', 'Performance Marketing',
      'Branding', 'Community Management', 'Leadgenerierung', 'CRM Management',
      'Projektmanagement', 'Teamarbeit', 'Kommunikation', 'Kundenbetreuung',
      'Verkaufspsychologie', 'Digitale Strategien', 'Online Vertrieb',
      'Storytelling', 'Analytisches Denken', 'Zeitmanagement', 'Verhandlungsführung',
      'Präsentationstechnik', 'Qualitätsmanagement', 'Prozessoptimierung',
      'Mitarbeiterführung', 'Konfliktmanagement', 'Problemlösung',
    ];
    generalSkills.forEach(s => {
      if (new RegExp(s, 'i').test(textOrig) && !skills.includes(s)) skills.push(s);
    });
  }

  return skills.slice(0, 20);
}

// ── KOMPÜTER BİLİKLƏRİ ───────────────────────────────────────────────────────
function parseComputerSkills(textOrig, lines) {
  const compSkills = [];

  const section = extractSectionText(textOrig, [
    'computerkenntnisse', 'computer skills', 'it-kenntnisse', 'software',
    'tools', 'programme', 'edv', 'technische kenntnisse', 'kompüter bilikləri',
    'digitale tools', 'anwendungen', 'it skills', 'technical skills', 'technische fähigkeiten'
  ]);

  if (section) {
    const sLines = section.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of sLines) {
      const cleaned = line.replace(/^[\u2022\-\*\u2713\u25BA\u25AA\u2192\u2714]\s*/, '').trim();
      if (cleaned.length > 1 && cleaned.length < 70) {
        cleaned.split(/[,;]/).forEach(p => {
          const s = p.trim();
          if (s.length > 1 && !compSkills.includes(s)) compSkills.push(s);
        });
      }
    }
  }

  // Məlum alətlər — bölmədən asılı olmayaraq
  const knownTools = [
    // Social Media & Marketing
    'Meta Business Suite', 'Facebook Ads Manager', 'Google Ads', 'Google Analytics',
    'Google Search Console', 'Google Tag Manager', 'TikTok Ads Manager',
    'LinkedIn Campaign Manager', 'Hootsuite', 'Buffer', 'Sprout Social',
    'SEMrush', 'Ahrefs', 'Moz', 'Mailchimp', 'ActiveCampaign', 'Klaviyo', 'HubSpot',
    // Design
    'Canva Pro', 'Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign',
    'Adobe Premiere Pro', 'Adobe After Effects', 'Adobe XD', 'Adobe Creative Cloud',
    'Figma', 'Sketch', 'InVision', 'Zeplin', 'CapCut', 'DaVinci Resolve', 'Final Cut Pro',
    // CRM / ERP
    'Zoho CRM', 'Bitrix24', 'Salesforce', 'Pipedrive', 'Monday CRM',
    'SAP', 'SAP S/4HANA', 'DATEV', 'Lexware', 'Oracle', 'Microsoft Dynamics',
    // Office / Collaboration
    'Microsoft Office', 'Microsoft Excel', 'Microsoft Word', 'Microsoft PowerPoint',
    'Microsoft Teams', 'Google Workspace', 'Google Sheets', 'Google Docs',
    'Slack', 'Trello', 'Asana', 'Notion', 'Jira', 'Monday.com', 'Confluence', 'ClickUp',
    // E-Commerce / CMS
    'WordPress', 'Shopify', 'WooCommerce', 'Magento', 'Wix', 'Squarespace', 'Webflow',
    // Dev Tools
    'Python', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
    'PHP', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Git', 'GitHub', 'Docker', 'AWS',
    // Engineering
    'AutoCAD', 'SolidWorks', 'CATIA', 'Revit', 'ArchiCAD', 'SketchUp', 'MATLAB',
    // Other
    'Tableau', 'Power BI', 'Looker', 'Zendesk', 'Freshdesk',
  ];

  knownTools.forEach(tool => {
    const escaped = tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(?:^|[\\s,;\\(])' + escaped + '(?:[\\s,;\\)]|$)', 'im');
    if (re.test(textOrig) && !compSkills.some(s => s.toLowerCase() === tool.toLowerCase())) {
      compSkills.push(tool);
    }
  });

  return compSkills.slice(0, 25);
}

// ── ƏLAVƏ BACARIQLAR ──────────────────────────────────────────────────────────
function parseAdditionalSkills(textOrig, lines) {
  const addSkills = [];

  const section = extractSectionText(textOrig, [
    'zusätzliche informationen', 'zusatzinformationen', 'weitere informationen',
    'sonstige informationen', 'persönliche stärken', 'soft skills', 'persönlichkeit',
    'əlavə məlumat', 'additional information', 'persönliches', 'sonstiges',
    'interessen', 'hobbys', 'hobbies', 'freizeit', 'ehrenamt', 'ehrenamtliche'
  ]);

  if (section) {
    const sLines = section.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of sLines) {
      const cleaned = line.replace(/^[\u2022\-\*\u2713\u25BA\u25AA\u2192\u2714\u25CF]\s*/, '').trim();
      if (cleaned.length > 3 && cleaned.length < 90 && !/^\d/.test(cleaned)) {
        cleaned.split(/[,;]/).forEach(p => {
          const s = p.trim();
          if (s.length > 3 && !addSkills.includes(s)) addSkills.push(s);
        });
      }
    }
  }

  return addSkills.slice(0, 15);
}

// ── SERTİFİKATLAR ─────────────────────────────────────────────────────────────
function parseCertifications(textOrig, lines) {
  const certs = [];

  const section = extractSectionText(textOrig, [
    'zertifikate', 'zertifizierungen', 'certifications', 'certificates',
    'auszeichnungen', 'awards', 'lizenzen', 'licenses', 'weiterbildung',
    'fortbildung', 'kurse', 'schulungen', 'sertifikatlar', 'sertifikasyon'
  ]);

  if (section) {
    const sLines = section.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of sLines) {
      const cleaned = line.replace(/^[\u2022\-\*\u2713\u25BA\u25AA\u2192\u2714]\s*/, '').trim();
      if (cleaned.length > 3 && cleaned.length < 100) {
        if (!certs.includes(cleaned)) certs.push(cleaned);
      }
    }
  }

  // Məlum sertifikat adları
  const knownCerts = [
    'Google Ads Certification', 'Google Analytics Certification',
    'Meta Blueprint Certification', 'HubSpot Content Marketing',
    'HubSpot Inbound Marketing', 'Salesforce Administrator',
    'AWS Certified', 'Microsoft Azure', 'Google Cloud',
    'PMP Certification', 'Prince2', 'Scrum Master', 'ITIL',
    'Goethe-Zertifikat', 'TELC', 'ÖSD', 'TestDaF', 'DSH',
    'IELTS', 'TOEFL', 'Cambridge Certificate',
  ];

  knownCerts.forEach(cert => {
    const re = new RegExp(cert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(textOrig) && !certs.some(c => c.toLowerCase().includes(cert.toLowerCase()))) {
      certs.push(cert);
    }
  });

  return certs.slice(0, 10);
}

// ── DİLLƏR ────────────────────────────────────────────────────────────────────
function parseLanguages(textOrig, lines) {
  const langs = [];

  const section = extractSectionText(textOrig, [
    'sprachkenntnisse', 'sprachen', 'languages', 'dillər',
    'fremdsprachen', 'sprachliche kenntnisse', 'dil bilikləri', 'language skills'
  ]);

  const searchText = section || textOrig;

  const langMap = {
    'aserbaidschanisch': 'AZ', 'azerbaijani': 'AZ', 'azerbaijanisch': 'AZ',
    'azərbaycanca': 'AZ', 'azerbaijanli': 'AZ', 'aseri': 'AZ',
    'türkisch': 'TR', 'turkish': 'TR', 'türkçe': 'TR', 'türk': 'TR',
    'deutsch': 'DE', 'german': 'DE', 'almanca': 'DE',
    'englisch': 'EN', 'english': 'EN', 'ingilis': 'EN', 'inglizce': 'EN',
    'russisch': 'RU', 'russian': 'RU', 'rusca': 'RU', 'rusça': 'RU',
    'französisch': 'FR', 'french': 'FR', 'fransızca': 'FR',
    'arabisch': 'AR', 'arabic': 'AR', 'arapça': 'AR',
    'spanisch': 'ES', 'spanish': 'ES', 'ispanyolca': 'ES',
    'italienisch': 'IT', 'italian': 'IT', 'italyanca': 'IT',
    'chinesisch': 'ZH', 'chinese': 'ZH', 'mandarin': 'ZH',
    'japanisch': 'JA', 'japanese': 'JA',
    'polnisch': 'PL', 'polish': 'PL',
    'ukrainisch': 'UK', 'ukrainian': 'UK',
    'georgisch': 'KA', 'georgian': 'KA',
    'persisch': 'FA', 'farsi': 'FA', 'persian': 'FA',
    'niederländisch': 'NL', 'dutch': 'NL', 'holländisch': 'NL',
    'schwedisch': 'SV', 'swedish': 'SV',
    'norwegisch': 'NO', 'norwegian': 'NO',
    'dänisch': 'DA', 'danish': 'DA',
    'portugiesisch': 'PT', 'portuguese': 'PT',
    'griechisch': 'EL', 'greek': 'EL',
    'rumänisch': 'RO', 'romanian': 'RO',
    'tschechisch': 'CS', 'czech': 'CS',
    'ungarisch': 'HU', 'hungarian': 'HU',
    'serbisch': 'SR', 'serbian': 'SR',
    'kroatisch': 'HR', 'croatian': 'HR',
    'bulgarisch': 'BG', 'bulgarian': 'BG',
    'slowakisch': 'SK', 'slovak': 'SK',
    'slowenisch': 'SL', 'slovenian': 'SL',
    'finnisch': 'FI', 'finnish': 'FI',
    'estnisch': 'ET', 'estonian': 'ET',
    'lettisch': 'LV', 'latvian': 'LV',
    'litauisch': 'LT', 'lithuanian': 'LT',
    'kasachisch': 'KK', 'kazakh': 'KK',
    'usbekisch': 'UZ', 'uzbek': 'UZ',
    'armenisch': 'HY', 'armenian': 'HY',
    'hebräisch': 'HE', 'hebrew': 'HE',
    'koreanisch': 'KO', 'korean': 'KO',
  };

  const levelNorm = {
    'muttersprache': 'Muttersprache', 'native': 'Muttersprache',
    'muttersprachler': 'Muttersprache', 'muttersprachlerin': 'Muttersprache',
    'ana dili': 'Muttersprache', 'erstsprache': 'Muttersprache',
    'native speaker': 'Muttersprache', 'native language': 'Muttersprache',
    'fließend': 'Fließend (C1)', 'fluent': 'Fließend (C1)',
    'sehr gut': 'Sehr gut (C1)', 'very good': 'Sehr gut (C1)',
    'verhandlungssicher': 'Verhandlungssicher (C1)',
    'business fluent': 'Business fluent (C1)',
    'gute kenntnisse': 'Gute Kenntnisse (B2)', 'good': 'Gut (B2)',
    'gut': 'Gut (B2)', 'gute': 'Gut (B2)',
    'fortgeschritten': 'Fortgeschritten (B2)', 'advanced': 'Fortgeschritten (B2)',
    'mittelstufe': 'Mittelstufe (B1)', 'mittel': 'Mittel (B1)',
    'intermediate': 'Mittel (B1)', 'mittelmäßig': 'Mittel (B1)',
    'grundkenntnisse': 'Grundkenntnisse (A2)', 'grundlagen': 'Grundlagen (A2)',
    'basic': 'Grundkenntnisse (A2)', 'basics': 'Grundkenntnisse (A2)',
    'anfänger': 'Anfänger (A1)', 'elementar': 'Elementar (A1)',
    'beginner': 'Anfänger (A1)',
    'a1': 'A1', 'a2': 'A2', 'b1': 'B1', 'b2': 'B2', 'c1': 'C1', 'c2': 'C2',
  };

  // Format: "Deutsch – B2" / "Englisch: C1" / "Turkish - Native"
  const langLineRe = /([A-ZÄÖÜa-zäöüəğışçöüñİ]+(?:isch|sch|ish|li|ca|ce|ça|ça|ance|ese)?)\s*[-–:]\s*([A-ZÄÖÜa-zäöüəğışçöüñ\s,\.\/()]+?)(?=\n|$|;)/gi;

  let m;
  while ((m = langLineRe.exec(searchText)) !== null) {
    const langRaw  = m[1].trim().toLowerCase();
    const levelRaw = m[2].trim().toLowerCase().replace(/[.,;]+$/, '');

    if (langRaw.length < 3) continue;

    const code = langMap[langRaw];
    if (!code) continue;

    // Səviyyəni normallaşdır — CEFR kodunu da axtar
    let level = '';
    const cefrMatch = levelRaw.match(/\b([abc][12])\b/i);
    if (cefrMatch) {
      level = cefrMatch[1].toUpperCase();
    } else {
      level = levelNorm[levelRaw] || m[2].trim().substring(0, 40);
    }

    const entry = code + ' – ' + level;
    if (!langs.some(l => l.startsWith(code + ' –'))) {
      langs.push(entry);
    }
  }

  // Fallback — sadə axtarış
  if (langs.length === 0) {
    for (const [langName, code] of Object.entries(langMap)) {
      if (langs.some(l => l.startsWith(code + ' –'))) continue;
      const re = new RegExp('\\b' + langName + '\\b', 'i');
      if (!re.test(searchText)) continue;

      const levelRe = new RegExp(langName + '[:\\s-–]+(\\w[^\\n,;]{0,40})', 'i');
      const lm = searchText.match(levelRe);
      const rawLevel = lm ? lm[1].trim().toLowerCase() : '';
      const level = levelNorm[rawLevel] || (rawLevel ? rawLevel : '');

      langs.push(code + (level ? ' – ' + level : ''));
    }
  }

  return langs.slice(0, 12);
}

// ── ƏLAQƏ ─────────────────────────────────────────────────────────────────────
function parseEmail(text) {
  const m = text.match(/[\w.+\-]+@[\w\-]+\.[\w.]{2,}/);
  return m ? m[0].toLowerCase() : '';
}

function parsePhone(text) {
  // +994 50 123 45 67, +49 151 12345678, 0151 12345678
  const labeled = text.match(/(?:telefon|tel|phone|mob(?:ile)?|handy)\s*[:\-]?\s*((?:\+\d{1,3}[\s\-]?)?\d[\d\s\-\(\)]{7,18}\d)/i);
  if (labeled) return labeled[1].replace(/[\s\-]/g, ' ').trim();

  const plain = text.match(/(?<!\d)(\+\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{2,4}[\s\-]?\d{0,4})(?!\d)/);
  if (plain) return plain[1].trim();

  const local = text.match(/\b(0\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{2,4})\b/);
  if (local) return local[1].trim();

  return '';
}

function parseWhatsApp(text) {
  const m = text.match(/(?:whatsapp|whats\s*app|wa\b|wp\b)\s*[:\-]?\s*(\+?[\d\s\-\(\)]{10,22})/i);
  return m ? m[1].replace(/[\s]/g, ' ').trim() : '';
}

function parseLinkedIn(text) {
  const m = text.match(/(?:linkedin\.com\/in\/|linkedin\s*[:\-]\s*)([^\s\n,/?"'<>]{3,60})/i);
  if (!m) return '';
  const profile = m[1].replace(/^.*linkedin\.com\/in\//i, '').replace(/\/$/, '');
  return 'linkedin.com/in/' + profile;
}

function parseWebsite(text) {
  // Şəxsi sayt — sosial media, e-mail, linkedin xaricindən
  const m = text.match(/(?:website|portfolio|homepage|web\s*site|sayt)\s*[:\-]?\s*(https?:\/\/[^\s\n,<>"']{5,80})/i);
  if (m) return m[1];

  const urlMatch = text.match(/(?<!\S)(https?:\/\/(?!linkedin|facebook|instagram|twitter|wa\.me)[^\s\n,<>"']{5,80})/i);
  if (urlMatch) return urlMatch[1];

  return '';
}

// ── MAAŞ & MÖVCUDLUq ──────────────────────────────────────────────────────────
function parseSalary(text) {
  // "3.000 – 4.000 € / Monat"
  const range = text.match(/(\d[\d.,]+)\s*[-–]\s*(\d[\d.,]+)\s*€(?:\s*\/\s*(?:monat|month|ay|jahr|year))?/i);
  if (range) return range[0].trim();

  // "ab 2500€"
  const fromVal = text.match(/(?:ab|from|mindestens|ab\s*ca\.?)\s*(\d[\d.,]+)\s*€/i);
  if (fromVal) return 'ab ' + fromVal[1] + ' €';

  // "€ 2500" veya "2500€"
  const single = text.match(/(?:€\s*(\d[\d.,]+)|(\d[\d.,]+)\s*€)/);
  if (single) return (single[1] || single[2]) + ' €';

  return '';
}

function parseAvailability(textLow) {
  if (/sofort\s*verfügbar|sofort\b|immediately|dərhal|ab\s*sofort|asap/.test(textLow)) return 'sofort';

  // "ab 01.2025", "ab Januar 2025"
  const dateM = textLow.match(/(?:ab|from|verfügbar\s*ab|available\s*from)\s*(\d{1,2}[.\/-]\d{4}|\d{1,2}\.\d{1,2}\.\d{4})/);
  if (dateM) return dateM[1];

  // "nach 3 Monaten"
  if (/nach\s*\d+\s*monat/.test(textLow)) {
    const m = textLow.match(/nach\s*(\d+)\s*monat/);
    return m ? 'nach ' + m[1] + ' Monaten' : '';
  }

  return '';
}

function parseWorkType(textLow) {
  if (/vollzeit|full[- ]?time|tam\s*ştat/.test(textLow))      return 'fulltime';
  if (/teilzeit|part[- ]?time|yarım\s*ştat/.test(textLow))    return 'parttime';
  if (/minijob|mini[- ]?job|geringfügig/.test(textLow))       return 'minijob';
  if (/freelance|freiberuflich|serbest/.test(textLow))        return 'freelance';
  if (/\bremote\b/.test(textLow))                             return 'remote';
  return '';
}

function parseRelocation(textLow) {
  if (/umzug.*bereit|relocation.*ready|köçməyə\s*hazır|weltweit\s*einsatz/.test(textLow)) return 'yes';
  if (/international.*einsatz|international.*bereit/.test(textLow))                         return 'yes';
  if (/umzug\s*möglich|relocation\s*possible|mümkündür/.test(textLow))                      return 'maybe';
  if (/kein\s*umzug|no\s*relocation|köçmək\s*istəmir/.test(textLow))                       return 'no';
  return '';
}

// ── TAGLINE ───────────────────────────────────────────────────────────────────
function parseTaglines(textOrig, lines, result) {
  const profileSection = extractSectionText(textOrig, [
    'profil', 'über mich', 'zusammenfassung', 'summary', 'professional summary',
    'kurzprofil', 'berufsprofil', 'haqqımda', 'xülasə', 'about me',
    'objective', 'career objective', 'persönliches profil', 'executive summary'
  ]);

  const de = profileSection
    ? profileSection.trim().substring(0, 500)
    : buildTaglineDE(result);

  const az = buildTaglineAZ(result);
  const en = buildTaglineEN(result);

  return { de, az, en };
}

function buildTaglineDE(r) {
  const parts = [];
  if (r.name) parts.push(r.name);
  if (r.field && r.field !== 'Andere') {
    const fieldDE = {
      'SocialMedia': 'Social Media & Content Management',
      'Marketing': 'Digital Marketing',
      'Verkauf': 'Vertrieb & Sales',
      'IT': 'IT & Softwareentwicklung',
      'Pflege': 'Medizin & Pflege',
      'Hotel': 'Hotel & Gastronomie',
      'Logistik': 'Logistik & Transport',
      'Bau': 'Bauwesen',
      'Buchhaltung': 'Buchhaltung & Finanzen',
    };
    const label = fieldDE[r.field] || r.field;
    parts.push(`Erfahrener Fachmann im Bereich ${label}`);
  }
  if (r.delevel)        parts.push(`Deutschkenntnisse: ${r.delevel}`);
  if (r.availableFrom === 'sofort') parts.push('Sofort verfügbar');
  return parts.join(' | ');
}

function buildTaglineAZ(r) {
  const fieldLabels = {
    'SocialMedia': 'SMM & Rəqəmsal Marketinq', 'Marketing': 'Rəqəmsal Marketinq',
    'Verkauf': 'Satış & CRM', 'IT': 'İT & Proqramlaşdırma',
    'Pflege': 'Tibb & Qulluq', 'Hotel': 'Hotel & Turizm',
    'Gastronomie': 'Qida & Restoran', 'Logistik': 'Logistik',
    'Bau': 'Tikinti', 'Büro': 'Ofis & İdarəetmə',
    'Koch': 'Aşpazlıq', 'PR': 'Media & PR', 'Buchhaltung': 'Mühasibat',
    'Personalwesen': 'HR & İnsan Resursları', 'Mühəndis': 'Mühəndislik',
    'Lehrer': 'Tədris & Təhsil', 'Design': 'Dizayn',
    'DataScience': 'Data Science & AI', 'Management': 'İdarəetmə',
  };

  const name      = r.name || 'Kandidat';
  const fieldAZ   = fieldLabels[r.field] || r.field || 'mütəxəssis';
  const deLevel   = r.delevel ? `Alman dili: ${r.delevel}. ` : '';
  const available = r.availableFrom === 'sofort' ? 'Dərhal işə başlamağa hazırdır.' : '';
  const exp       = r.experiences && r.experiences.length > 0
    ? `${r.experiences.length}+ iş təcrübəsi. ` : '';

  return `${name} — ${fieldAZ} sahəsində beynəlxalq iş təcrübəsinə malik peşəkar. ${exp}${deLevel}${available}`.trim();
}

function buildTaglineEN(r) {
  const name    = r.name || 'Candidate';
  const field   = r.field || 'their field';
  const deLevel = r.delevel ? `German level: ${r.delevel}. ` : '';
  const avail   = r.availableFrom === 'sofort' ? 'Immediately available.' : '';
  const exp     = r.experiences && r.experiences.length > 0
    ? `${r.experiences.length}+ years of experience. ` : '';

  return `${name} — Results-driven professional in ${field} with international background. ${exp}${deLevel}${avail}`.trim();
}

// ══════════════════════════════════════════════════════════════════════════════
//  BÖLMƏ ÇIXARICI — ən vacib yardımçı funksiya
// ══════════════════════════════════════════════════════════════════════════════

function extractSectionText(text, keywords) {
  const lines = text.split('\n');

  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineL     = lines[i].toLowerCase().trim();
    const lineClean = lineL.replace(/[^a-zäöüəğışçöüñ\s]/g, '').trim();

    for (const kw of keywords) {
      if (lineClean === kw ||
          lineClean.startsWith(kw + ' ') ||
          lineL.includes(kw)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx !== -1) break;
  }

  if (startIdx === -1) return null;

  const knownSections = [
    'berufserfahrung', 'berufliche erfahrung', 'work experience', 'professional experience',
    'ausbildung', 'bildung', 'studium', 'education', 'qualifikation', 'akademische',
    'sprachen', 'sprachkenntnisse', 'languages', 'fremdsprachen',
    'computerkenntnisse', 'it-kenntnisse', 'software', 'tools', 'programme', 'edv',
    'kernkompetenzen', 'kompetenzen', 'fähigkeiten', 'skills', 'qualifikationen',
    'stärken', 'kenntnisse', 'schlüsselkompetenzen',
    'zertifikate', 'zertifizierungen', 'certifications', 'certificates',
    'profil', 'über mich', 'zusammenfassung', 'summary', 'kurzprofil',
    'kontakt', 'contact', 'persönliches', 'angaben',
    'zusätzliche', 'sonstige', 'interessen', 'hobbys', 'hobbies',
    'referenzen', 'references', 'publications', 'awards',
    'təhsil', 'iş təcrübəsi', 'bacarıqlar', 'dillər', 'əlaqə', 'sertifikatlar',
  ];

  const isSectionHeader = (line) => {
    const l = line.trim();
    if (l.length < 3 || l.length > 60)  return false;
    if (/^[•\-\*✓►▪→✔◦\d]/.test(l))   return false;
    if (/[,;@]/.test(l))               return false;
    if (!/^[A-ZÄÖÜĞŞƏÇIÏ]/.test(l) && !/^[A-ZÄÖÜa-zäöüəğışçöüñ]/.test(l)) return false;
    const lLow = l.toLowerCase();
    return knownSections.some(s => lLow === s || lLow.startsWith(s));
  };

  const contentLines = [];
  const maxLines     = 50;

  for (let j = startIdx + 1; j < lines.length && contentLines.length < maxLines; j++) {
    const line = lines[j].trim();

    if (!line) { contentLines.push(''); continue; }

    if (isSectionHeader(line) && contentLines.filter(l => l).length >= 1) {
      break;
    }

    contentLines.push(line);
  }

  // Sondakı boş sətirləri sil
  while (contentLines.length > 0 && !contentLines[contentLines.length - 1]) {
    contentLines.pop();
  }

  return contentLines.join('\n') || null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORMA TƏTBİQ ET
// ══════════════════════════════════════════════════════════════════════════════

function applyToForm(result) {
  if (!result) return;

  const setVal = (id, val) => {
    if (!val) return;
    const el = document.getElementById(id);
    if (!el) return;

    if (el.tagName === 'SELECT') {
      // Select üçün — dəyər varsa seç
      const opt = Array.from(el.options).find(o =>
        o.value.toLowerCase() === String(val).toLowerCase() ||
        o.text.toLowerCase()  === String(val).toLowerCase()
      );
      if (opt) el.value = opt.value;
    } else {
      el.value = val;
    }

    // Change event tetiklə (React/Vue üçün)
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // ── Sadə sahələr
  const fieldMap = {
    'f-name':          result.name,
    'f-gender':        result.gender,
    'f-nationality':   result.nationality,
    'f-location':      result.location,
    'f-type':          result.type,
    'f-field':         result.field,
    'f-delevel':       result.delevel,
    'f-visa':          result.visa,
    'f-edu-level':     result.eduLevel,
    'f-edu-school':    result.eduSchool,
    'f-edu-major':     result.eduMajor,
    'f-edu-years':     result.eduYears,
    'f-email':         result.email,
    'f-phone':         result.phone,
    'f-whatsapp':      result.whatsapp,
    'f-linkedin':      result.linkedin,
    'f-website':       result.website,
    'f-salary':        result.salary,
    'f-available-from': result.availableFrom,
    'f-work-type':     result.workType,
    'f-relocation':    result.relocation,
    'f-status':        result.status,
    'f-priority':      result.priority,
    'f-tagline-az':    result.taglineAZ,
    'f-tagline-de':    result.taglineDE,
    'f-tagline-en':    result.taglineEN,
  };

  for (const [id, val] of Object.entries(fieldMap)) {
    setVal(id, val);
  }

  // ── Doğum tarixi
  if (result.dob) {
    if (typeof setDobFromString === 'function') {
      setDobFromString(result.dob);
    } else {
      setVal('f-dob', result.dob);
    }
  }

  // ── Qeydlər
  const notesEl = document.getElementById('f-notes');
  if (notesEl) {
    const langStr = (result.langs || []).join(', ') || '—';
    const expStr  = (result.experiences || []).length + ' təcrübə';
    notesEl.value =
      `[MZ Parser v3.0] ${new Date().toLocaleString('az-AZ')}\n` +
      `Sahə: ${result.field || '—'} | Növ: ${result.type || '—'} | DE: ${result.delevel || '—'}\n` +
      `Dillər: ${langStr} | Təcrübə: ${expStr}`;
    notesEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── İş təcrübəsi siyahısı
  const expList = document.getElementById('exp-list');
  if (expList) {
    expList.innerHTML = '';
    if (typeof gExpRows !== 'undefined') gExpRows.length = 0;
    if (typeof expCounter !== 'undefined')
      window.expCounter = 0;

    const experiences = result.experiences || [];
    if (experiences.length > 0) {
      experiences.forEach(exp => {
        if (typeof addExpRow === 'function') addExpRow(exp.title, exp.year);
      });
    } else {
      if (typeof addExpRow === 'function') addExpRow();
    }
  }

  // ── Tag sahələri — təmizlə və doldur
  const tagData = [
    { arr: 'gSkills',          ids: ['skills-wrap',            'skills-input'],            data: result.skills          },
    { arr: 'gComputerSkills',  ids: ['computer-skills-wrap',   'computer-skills-input'],   data: result.computerSkills  },
    { arr: 'gAdditionalSkills',ids: ['additional-skills-wrap', 'additional-skills-input'], data: result.additionalSkills},
    { arr: 'gLangs',           ids: ['langs-wrap',             'langs-input'],             data: result.langs           },
    { arr: 'gCerts',           ids: ['certs-wrap',             'certs-input'],             data: result.certifications  },
  ];

  for (const { arr, ids, data } of tagData) {
    if (typeof window[arr] !== 'undefined') {
      window[arr].length = 0;
      (data || []).forEach(item => {
        if (!window[arr].includes(item)) window[arr].push(item);
      });
      if (typeof renderTags === 'function') {
        renderTags(ids[0], ids[1], window[arr]);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  YARDIMÇI FUNKSİYALAR
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Toast bildiriş göstər
 * @param {string} msg    - Mesaj mətni
 * @param {'success'|'error'|'info'} type - Növ
 * @param {number} [duration=3500] - ms
 */
function showToast(msg, type = 'info', duration = 3500) {
  // Mövcud toast varsa sil
  const existing = document.getElementById('mz-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'mz-toast';

  const colors = {
    success: '#22c55e',
    error:   '#ef4444',
    info:    '#3b82f6',
    warning: '#f59e0b',
  };

  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    background:   colors[type] || colors.info,
    color:        '#fff',
    padding:      '12px 20px',
    borderRadius: '10px',
    fontSize:     '14px',
    fontWeight:   '600',
    boxShadow:    '0 4px 20px rgba(0,0,0,0.25)',
    zIndex:       '99999',
    maxWidth:     '380px',
    lineHeight:   '1.4',
    transition:   'opacity 0.3s ease',
    opacity:      '1',
  });

  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/**
 * Modal bağla — əgər funksiya mövcuddursa
 */
function closeAIModal() {
  // Müxtəlif modal adlarını yoxla
  const modalIds = ['ai-modal', 'cv-parse-modal', 'modal-ai', 'parse-modal'];
  for (const id of modalIds) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('active', 'visible', 'open');
      return;
    }
  }

  // Bootstrap / custom modalları
  const visibleModal = document.querySelector('.modal.show, .modal.visible, .modal.active');
  if (visibleModal) {
    visibleModal.style.display = 'none';
    visibleModal.classList.remove('show', 'visible', 'active');
  }
}

/**
 * Nümunə CV mətni ilə test et
 */
function testParser() {
  const sampleCV = `Farid Akhundov
Marketing Manager & Digital Strategist

Kontakt:
Email: farid.akhundov@gmail.com
Tel: +994 50 123 45 67
WhatsApp: +994 50 123 45 67
LinkedIn: linkedin.com/in/faridakhundov

Geburtsdatum: 15.04.1990
Wohnort: Istanbul, Türkiye
Staatsangehörigkeit: Aserbaidschanisch

Profil
Erfahrener Digital Marketing Manager mit 8+ Jahren Berufserfahrung in der DACH-Region.
Spezialisiert auf Performance Marketing, Social Media und Brand Management.
Sofort verfügbar. Umzug bereit.

Berufserfahrung

01/2020 – heute
Senior Marketing Manager @ TechCorp GmbH, Istanbul
Verantwortlich für alle digitalen Marketingaktivitäten

03/2017 – 12/2019
Social Media Manager @ BrandX Agency, Ankara

06/2015 – 02/2017
Junior Marketing Specialist @ StartupY, Baku

Ausbildung
Bachelor of Science in Marketing
Istanbul Technical University
2011 – 2015

Sprachkenntnisse
Aserbaidschanisch – Muttersprache
Türkisch – Muttersprache
Deutsch – B2
Englisch – C1
Russisch – B1

Kernkompetenzen
Performance Marketing, Social Media Management, Content Strategy
Brand Management, CRM, Google Ads, Meta Ads, SEO/SEM
Projektmanagement, Teamführung, Analytisches Denken

Computerkenntnisse
Google Ads, Meta Business Suite, HubSpot, Salesforce
Adobe Photoshop, Canva, Google Analytics, SEMrush
Microsoft Office, Slack, Trello, Notion

Gehaltsvorstellung: 4.000 – 5.000 € / Monat
Verfügbarkeit: Sofort
Vollzeit`;

  const textarea = document.getElementById('ai-cv-text');
  if (textarea) {
    textarea.value = sampleCV;
    showToast('✅ Test CV yükləndi. "Analiz Et" düyməsinə basın.', 'info');
  } else {
    console.log('[MZ Parser Test] Result:', deepParseCV(sampleCV));
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  EXPORT — Module / Global
// ══════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAIParse,
    deepParseCV,
    applyToForm,
    extractSectionText,
    parseName,
    parseDOB,
    parseGender,
    parseNationality,
    parseLocation,
    parseField,
    parseType,
    parseDeutschLevel,
    parseVisa,
    parseEducation,
    parseExperiences,
    parseSkills,
    parseComputerSkills,
    parseAdditionalSkills,
    parseCertifications,
    parseLanguages,
    parseEmail,
    parsePhone,
    parseWhatsApp,
    parseLinkedIn,
    parseWebsite,
    parseSalary,
    parseAvailability,
    parseWorkType,
    parseRelocation,
    showToast,
    closeAIModal,
    testParser,
  };
}