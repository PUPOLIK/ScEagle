// content.js - ScEagle контент-скрипт с авто-проверкой, баннером и звуком

console.log('ScEagle загружен на:', window.location.hostname);

// Создаем экземпляр WhoisChecker
const whoisChecker = new WhoisChecker();

// Флаг, чтобы звук срабатывал только один раз
let soundPlayed = false;

// Функция для воспроизведения звука
function playWarningSound() {
  if (soundPlayed) return;
  
  try {
    const audio = new Audio(chrome.runtime.getURL('sounds/eagle-warning.mp3'));
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Не удалось воспроизвести звук:', e));
    soundPlayed = true;
    console.log('Звук предупреждения воспроизведен');
  } catch (error) {
    console.log('Ошибка со звуком:', error);
  }
}

// Функция для создания баннера
function showWarningBanner(days, creationDate) {
  console.log('Попытка создать баннер для сайта возрастом', days, 'дней');
  
  playWarningSound();
  
  if (document.getElementById('sceagle-warning-banner')) {
    console.log('Баннер уже существует');
    return;
  }
  
  const banner = document.createElement('div');
  banner.id = 'sceagle-warning-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #ff4444;
    color: white;
    text-align: center;
    padding: 15px;
    font-family: Arial, sans-serif;
    font-size: 16px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    border-bottom: 2px solid #cc0000;
  `;
  
  banner.innerHTML = `
    <span style="margin-right: 10px;">⚠️</span>
    <strong>ВНИМАНИЕ!</strong> 
    Этот сайт был создан <strong>${days} дней</strong> назад (${creationDate}). 
    Новые сайты могут быть мошенническими. Будьте осторожны!
    <button onclick="this.parentElement.remove(); document.body.style.marginTop = '';" style="
      margin-left: 20px;
      background: white;
      border: none;
      color: #ff4444;
      padding: 5px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    ">✕ Закрыть</button>
  `;
  
  document.body.prepend(banner);
  console.log('Баннер добавлен на страницу');
  
  setTimeout(() => {
    document.body.style.marginTop = '60px';
    console.log('Отступ для body установлен');
  }, 100);
}

function removeBanner() {
  const banner = document.getElementById('sceagle-warning-banner');
  if (banner) {
    banner.remove();
    document.body.style.marginTop = '';
    console.log('Баннер удален');
  }
}

async function autoCheckDomain() {
  const domain = window.location.hostname;
  
  if (domain === 'localhost' || domain === '127.0.0.1') {
    console.log('Локальный адрес, пропускаем');
    return;
  }
  
  console.log('ScEagle автоматическая проверка для:', domain);
  
  try {
    const result = await whoisChecker.checkDomain(domain);
    console.log('Результат проверки:', result);
    
    if (result.success && result.creationDate !== null && result.ageInDays < 3) {
      console.log('Условие сработало! Возраст', result.ageInDays, '< 3');
      showWarningBanner(result.ageInDays, result.creationDate);
    } else {
      if (result.creationDate === null) {
        console.log('Не удалось определить дату регистрации, баннер не показываем');
      } else {
        console.log('Условие НЕ сработало. Возраст:', result.ageInDays);
      }
    }
  } catch (error) {
    console.error('Ошибка при авто-проверке:', error);
  }
}

if (document.readyState === 'loading') {
  console.log('Страница загружается, ждем DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', autoCheckDomain);
} else {
  console.log('Страница уже загружена, запускаем сразу');
  autoCheckDomain();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('ScEagle контент-скрипт получил:', request);
  
  if (request.action === 'performWhoisCheck') {
    whoisChecker.checkDomain(request.domain)
      .then(result => {
        chrome.runtime.sendMessage({
          action: 'whoisResult',
          data: result
        });
      })
      .catch(error => {
        chrome.runtime.sendMessage({
          action: 'whoisResult',
          data: {
            success: false,
            error: error.message
          }
        });
      });
  }
  
  if (request.action === 'removeBanner') {
    removeBanner();
  }
});