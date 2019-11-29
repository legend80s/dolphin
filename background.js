chrome.runtime.onInstalled.addListener(async () => {
  console.log('onInstalled');
});

chrome.browserAction.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
})

chrome.runtime.onMessage.addListener((request, sender) => {
  console.log('sender:', sender);
  console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
  const { type, payload: { text } } = request;

  if (type == 'UPDATE_BADGE_TEXT') {
    chrome.browserAction.setBadgeText({ text, tabId: sender.tab.id });
  }
});
