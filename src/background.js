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

setupMenuContext();

// create menuContext when right click
function setupMenuContext() {
  const DECODER_ID = 'dolphin-decoder';
  const ENCODER_ID = 'dolphin-encoder';

  chrome.contextMenus.create({
    type: 'separator',
    id: 'dolphin-separator',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    type: 'normal',
    id: DECODER_ID,
    title: 'decode "%s"',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    type: 'normal',
    id: ENCODER_ID,
    title: 'encode "%s"',
    contexts: ['selection'],
  });

  chrome.contextMenus.onClicked.addListener(({ menuItemId, selectionText }) => {
    if (menuItemId === DECODER_ID) {
      return decode(selectionText);
    }

    if (menuItemId === ENCODER_ID) {
      return encode(selectionText);
    }
  });
}

function decode(selectionText) {
  if (!selectionText) { return; }

  let decoded;

  try {
    decoded = decodeURIComponent(selectionText);
  } catch (error) {
    return showModal(`decode "${selectionText}" error: ${error.message}`)
  }

  showModal(decoded);
}

function encode(selectionText) {
  if (!selectionText) { return; }

  let encoded;

  try {
    encoded = encodeURIComponent(selectionText);
  } catch (error) {
    return showModal(`encode "${selectionText}" error: ${error.message}`)
  }

  showModal(encoded);
}

function showModal(text) {
  alert(text);
}
