// lib/legit-domains.js - Список доверенных доменов для сравнения

let legitDomains = [];
let authPaths = [];
let suspiciousPatterns = [];

// Функция для вычисления расстояния Левенштейна
function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}


function cleanDomain(domain) {// Вспомогательная функция для очистки домена от www.
  if (!domain) return '';
  return domain.replace(/^www\./, '').toLowerCase();
}

// Проверка, что страница является страницей входа
function isAuthPage(url) {
  if (!url) return false;
  
  const lowerUrl = url.toLowerCase();
  for (const path of authPaths) {
    if (lowerUrl.includes(path)) {
      return true;
    }
  }
  return false;
}

// Проверка на подозрительные слова в URL
function hasSuspiciousKeywords(url) {
  if (!url) return false;
  
  const lowerUrl = url.toLowerCase();
  for (const pattern of suspiciousPatterns) {
    if (lowerUrl.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function checkTyposquatting(domain, currentUrl = '') {// Проверка на тайпсквоттинг с учётом URL
  // Очищаем домен от www. для сравнения
  const cleanDomainValue = cleanDomain(domain);
  
  if (!legitDomains || legitDomains.length === 0) {// Если список доменов еще не загружен
    return { isLegit: false, typosquatting: false, error: 'Список доменов загружается...' };
  }
  
  const results = [];
  const isAuthPageFlag = isAuthPage(currentUrl);
  const hasSuspiciousFlag = hasSuspiciousKeywords(currentUrl);
  
  for (const legit of legitDomains) {
    
    const cleanLegit = cleanDomain(legit);// Очищаем легитимный домен
    
    if (cleanDomainValue === cleanLegit) {// Точное совпадение
      if (isAuthPageFlag) {
        return {
          isLegit: true,
          isAuthPage: true,
          matches: [legit],
          typosquatting: false,
          cleanDomain: cleanDomainValue
        };
      }
      return {
        isLegit: true,
        matches: [legit],
        typosquatting: false,
        cleanDomain: cleanDomainValue
      };
    }
    
  
    if (cleanDomainValue.endsWith('.' + cleanLegit)) {
      console.log(`✅ Домен ${cleanDomainValue} является поддоменом ${cleanLegit}`);
      if (isAuthPageFlag) {
        return {
          isLegit: true,
          isSubdomain: true,
          isAuthPage: true,
          matches: [legit],
          typosquatting: false,
          cleanDomain: cleanDomainValue
        };
      }
      return {
        isLegit: true,
        isSubdomain: true,
        matches: [legit],
        typosquatting: false,
        cleanDomain: cleanDomainValue
      };
    }
    
    // Расстояние Левенштейна (для похожих, но не точных доменов)
    const distance = levenshteinDistance(cleanDomainValue, cleanLegit);
    
    if (distance < 3 && distance > 0) {
      results.push({
        domain: legit,
        distance: distance
      });
    }
    
    // ⚠️ СТАРУЮ ПРОВЕРКУ НА ПОДДОМЕНЫ УБИРАЕМ
    // (было: if (cleanDomainValue.includes(cleanLegit) && cleanDomainValue !== cleanLegit))
    // Теперь используется правильная проверка endsWith выше
  }
  
  // Если нашли подозрительное сходство (по расстоянию Левенштейна)
  if (results.length > 0) {
    return {
      isLegit: false,
      matches: results,
      typosquatting: true,
      isAuthPage: isAuthPageFlag,
      hasSuspiciousKeywords: hasSuspiciousFlag,
      cleanDomain: cleanDomainValue
    };
  }
  
  // Отдельная проверка: если страница входа, но домен не доверенный
  if (isAuthPageFlag) {
    return {
      isLegit: false,
      typosquatting: true,
      isAuthPage: true,
      message: 'Страница входа на НЕДОВЕРЕННОМ домене!',
      cleanDomain: cleanDomainValue
    };
  }
  
  return {
    isLegit: false,
    typosquatting: false,
    cleanDomain: cleanDomainValue
  };
}

// Загрузка списка доменов из JSON-файла
async function loadLegitDomains() {
  try {
    const response = await fetch(chrome.runtime.getURL('lib/legit-domains.json'));
    const data = await response.json();
    legitDomains = data.domains || [];
    authPaths = data.auth_paths || ['/login', '/auth', '/signin', '/lk'];
    suspiciousPatterns = data.suspicious_patterns || ['gosuslugi', 'nalog', 'sberbank'];
    console.log(`Загружено ${legitDomains.length} доверенных доменов`);
    console.log(`Проверяемые пути входа: ${authPaths.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Ошибка загрузки списка доменов:', error);
    // Резервный список на случай ошибки
    legitDomains = [
      'gosuslugi.ru', 'esia.gosuslugi.ru', 'sberbank.ru', 'vk.com', 'google.com'
    ];
    authPaths = ['/login', '/auth', '/signin'];
    suspiciousPatterns = ['gosuslugi', 'nalog'];
    return false;
  }
}

// Загружаем список сразу
loadLegitDomains();

// Экспортируем функции
window.legitDomains = legitDomains;
window.checkTyposquatting = checkTyposquatting;
window.loadLegitDomains = loadLegitDomains;
window.isAuthPage = isAuthPage;
window.cleanDomain = cleanDomain;