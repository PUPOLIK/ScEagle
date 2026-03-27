// background.js

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      console.log('Текущий сайт:', url.hostname);
    } catch (e) {}
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'getCurrentDomain') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          sendResponse({ domain: url.hostname });
        } catch (e) {
          sendResponse({ domain: null });
        }
      } else {
        sendResponse({ domain: null });
      }
    });
    return true;
  }
  
  if (request.action === 'checkDomainWhois') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'performWhoisCheck',
          domain: request.domain
        });
      }
    });
  }
});