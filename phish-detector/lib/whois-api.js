// lib/whois-api.js - WHOIS модуль для проверки возраста домена

class WhoisChecker {
  constructor() {
    console.log('WhoisChecker инициализирован');
  }

  // Функция для получения основного домена (без поддоменов)
  getMainDomain(domain) {
    const parts = domain.split('.');
    // Если домен имеет больше 2 частей (например, esia.gosuslugi.ru)
    if (parts.length > 2) {
      // Берем последние две части (gosuslugi.ru)
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  async checkDomain(domain, currentUrl = '') {
    // Обрезаем www.
    let cleanDomain = domain.replace(/^www\./, '');
    
    // Сохраняем исходный для отображения
    const originalDomain = cleanDomain;
    
    // Для WHOIS используем основной домен (без поддоменов)
    const whoisDomain = this.getMainDomain(cleanDomain);
    
    console.log('Проверка домена через сервер:', whoisDomain);
    console.log('Исходный домен:', originalDomain);
    
    try {
      const serverUrl = 'https://sceagle.minbed.ru';
      const response = await fetch(`${serverUrl}/?domain=${whoisDomain}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Ответ от сервера:', data);
      
      const creationDate = data.creation_date;
      
      // Проверка на тайпсквоттинг (используем исходный домен)
      let typosquatting = null;
      if (window.checkTyposquatting) {
        typosquatting = window.checkTyposquatting(originalDomain, currentUrl);
        console.log('Проверка на тайпсквоттинг:', typosquatting);
      }
      
      if (!creationDate) {
        console.log('Дата регистрации не найдена');
        return {
          success: true,
          domain: originalDomain,
          creationDate: null,
          ageInDays: null,
          ageInHours: null,
          isYoung: false,
          isCritical: false,
          riskLevel: 'unknown',
          riskColor: 'unknown',
          message: 'Не удалось определить дату регистрации. WHOIS может быть скрыт регистратором.',
          typosquatting: typosquatting
        };
      }

      const date = new Date(creationDate);
      const now = new Date();
      const ageInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      // Определяем уровень опасности
      let riskLevel = 'safe';
      let riskColor = 'safe';
      let riskMessage = '';
      
      if (ageInDays < 3) {
        riskLevel = 'critical';
        riskColor = 'critical';
        riskMessage = `КРИТИЧНО! Домену всего ${ageInDays} дней! Это может быть мошеннический сайт.`;
      } else if (ageInDays < 30) {
        riskLevel = 'warning';
        riskColor = 'warning';
        riskMessage = `ВНИМАНИЕ! Домену ${ageInDays} дней (меньше месяца). Будьте осторожны.`;
      } else {
        riskLevel = 'safe';
        riskColor = 'safe';
        riskMessage = `Домену ${ageInDays} дней. Скорее всего, безопасно.`;
      }

      return {
        success: true,
        domain: originalDomain,
        creationDate: date.toISOString().split('T')[0],
        ageInDays: ageInDays,
        ageInHours: ageInDays * 24,
        isYoung: ageInDays < 30,
        isCritical: ageInDays < 3,
        riskLevel: riskLevel,
        riskColor: riskColor,
        message: riskMessage,
        typosquatting: typosquatting
      };
      
    } catch (error) {
      console.error('Ошибка при запросе к серверу:', error);
      return {
        success: false,
        domain: originalDomain,
        error: error.message,
        message: 'Ошибка подключения к серверу. Проверьте интернет-соединение.'
      };
    }
  }
}

window.WhoisChecker = WhoisChecker;