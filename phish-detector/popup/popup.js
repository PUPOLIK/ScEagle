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
  
  
  function formatTyposquattingWarning(typo) {// Функция для отображения предупреждения о тайпсквоттинге
    if (!typo) return '';
    
    if (typo.isLegit) {
      return '<div class="safe"><strong>✅ Доверенный домен</strong></div>';
    }
    
    if (typo.typosquatting) {
      let html = '<div class="critical" style="background-color:#ffebee; border-left-color:#d32f2f; padding:10px; margin:10px 0;">';
      html += '<strong>⚠️ ПОДОЗРЕНИЕ НА ПОДДЕЛКУ!</strong><br>';
      html += 'Этот сайт может имитировать:';
      for (const match of typo.matches) {
        if (match.type === 'subdomain') {
          html += `<br>• Похож на поддомен: ${match.domain}`;
        } else {
          html += `<br>• Похож на: ${match.domain} (сходство: ${match.distance} символа)`;
        }
      }
      html += '</div>';
      return html;
    }
    
    return '';
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'whoisResult') {
      if (request.data.success) {
        

        const typoHtml = formatTyposquattingWarning(request.data.typosquatting); // Форматируем предупреждение о тайпсквоттинге
        
        if (request.data.riskLevel === 'unknown') {//дата не найдена WHOIS скрыт
          whoisResult.innerHTML = `
            ${typoHtml}
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
          ${typoHtml}
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