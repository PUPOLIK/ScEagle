// lib/whois-api.js - WHOIS модуль для проверки возраста домена
// Использует свой сервер на sceagle.minbed.ru замените на свой

class WhoisChecker {
  constructor() {
    console.log('WhoisChecker инициализирован');
  }

  async checkDomain(domain) {
    console.log('Проверка домена через сервер:', domain);
    
    try {
      const serverUrl = 'https://sceagle.minbed.ru'; // замените
      
      const response = await fetch(`${serverUrl}/?domain=${domain}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Ответ от сервера:', data);
      
      const creationDate = data.creation_date;
      
      
      if (!creationDate) {
        console.log('Дата регистрации не найдена');// если дата не найдена в ответе
        return {
          success: true,
          domain: domain,
          creationDate: null,
          ageInDays: null,
          ageInHours: null,
          isYoung: false,
          isCritical: false,
          riskLevel: 'unknown',
          riskColor: 'unknown',
          message: 'Не удалось определить дату регистрации. WHOIS может быть скрыт регистратором.'
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
        domain: domain,
        creationDate: date.toISOString().split('T')[0],
        ageInDays: ageInDays,
        ageInHours: ageInDays * 24,
        isYoung: ageInDays < 30,
        isCritical: ageInDays < 3,
        riskLevel: riskLevel,
        riskColor: riskColor,
        message: riskMessage
      };
      
    } catch (error) {
      console.error('Ошибка при запросе к серверу:', error);
      return {
        success: false,
        domain: domain,
        error: error.message,
        message: 'Ошибка подключения к серверу. Проверьте интернет-соединение.'
      };
    }
  }
}

window.WhoisChecker = WhoisChecker;