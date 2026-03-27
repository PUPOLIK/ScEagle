// popup/popup.js

document.addEventListener('DOMContentLoaded', function() {
  const domainInfo = document.getElementById('domainInfo');
  const whoisResult = document.getElementById('whoisResult');
  const checkBtn = document.getElementById('checkBtn');

  chrome.runtime.sendMessage({ action: 'getCurrentDomain' }, (response) => {
    if (response && response.domain) {
      domainInfo.innerHTML = `<strong>Текущий сайт:</strong> ${response.domain}`;
      checkWhois(response.domain);
    } else {
      domainInfo.innerHTML = '<strong>Ошибка:</strong> Не удалось определить домен';
    }
  });

  checkBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getCurrentDomain' }, (response) => {
      if (response && response.domain) {
        checkWhois(response.domain);
      }
    });
  });

  function checkWhois(domain) {
    whoisResult.innerHTML = '<div class="info">Проверка возраста домена...</div>';
    
    chrome.runtime.sendMessage({ 
      action: 'checkDomainWhois', 
      domain: domain 
    });
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'whoisResult') {
      if (request.data.success) {
        
        // Случай: дата не найдена (WHOIS скрыт)
        if (request.data.riskLevel === 'unknown') {
          whoisResult.innerHTML = `
            <div class="info">
              <strong>⚠️ НЕТ ДАННЫХ</strong><br><br>
              Домен: ${request.data.domain}<br>
              ${request.data.message}
            </div>
          `;
          return;
        }
        
        // Определяем класс для отображения
        let statusClass = 'safe';
        let statusText = 'БЕЗОПАСНО';
        
        if (request.data.ageInDays < 3) {
          statusClass = 'critical';
          statusText = 'КРИТИЧЕСКИ ОПАСНО';
        } else if (request.data.ageInDays < 30) {
          statusClass = 'warning';
          statusText = 'ПОДОЗРИТЕЛЬНО';
        }
        
        let testNote = '';
        if (request.data.isTestData) {
          testNote = '<br><small style="color: #999;">(тестовые данные)</small>';
        }
        
        whoisResult.innerHTML = `
          <div class="${statusClass}">
            <strong>${statusText}</strong><br><br>
            Домен: ${request.data.domain}<br>
            Создан: ${request.data.creationDate}<br>
            Возраст: ${request.data.ageInDays} дней<br>
            ${request.data.message}
            ${testNote}
          </div>
        `;
        
      } else {
        whoisResult.innerHTML = `
          <div class="danger">
            Ошибка: ${request.data.error}
          </div>
        `;
      }
    }
  });
});