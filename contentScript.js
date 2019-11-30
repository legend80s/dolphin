async function main() {
  const delay = await getDelay();

  // wait for all the async request completed then do the decode
  delay !== -1 && setTimeout(() => decode(delay), delay);
}

main();

function findAllTextNodes(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodeList = [];

  while(walker.nextNode()) {
    nodeList.push(walker.currentNode);
  }

  return nodeList;
}

function log(...args) {
  console.log(...args);
}

function decode(delay) {
  const textNodes = findAllTextNodes(document.body);
  const encodedTextNodes = textNodes.filter(({ textContent }) => isEncoded(textContent));

  encodedTextNodes.forEach(textNode => {
    textNode.textContent = textNode.textContent
      + `🐬` + decodeURIComponent(textNode.textContent) + '🐬';
  });

  chrome.runtime.sendMessage({
    type: 'UPDATE_BADGE_TEXT',
    payload: { text: String(encodedTextNodes.length) }
  });

  console.group('🐬.crx', chrome.extension.getURL('options.html'))
  log('After', delay, 'ms, the async rendering is expected to complete.');
  log('Find', textNodes.length, 'textNode(s).');
  log('%c%d', 'color:blue;', encodedTextNodes.length, 'textNode(s) `decodeURIComponent`ed.');
  console.groupEnd();
}

/**
 * Detect whether JavasScript string has been encoded using encodeURIComponent
 *
 * https://stackoverflow.com/questions/19650431/detect-whether-javasscript-string-has-been-encoded-using-encodeuricomponent
 *
 * @param {string} str
 */
function isEncoded(str) {
  // console.log('str:', str);
  try {
    return typeof str === 'string' && decodeURIComponent(str) !== str;
  } catch (error) {
    return false;
  }
}

async function getDelay() {
  const DEFAULT_DELAY = 1000;
  const href = window.location.href;

  try {
    const rules = await getRules();
    const rule = rules.find(rule => href.startsWith(rule.url))

    if (!rule) {
      console.group('🐬.crx', chrome.extension.getURL('options.html'))
      console.log('No rule found for current window. Dolphin switched off.');
      console.groupEnd();

      return -1;
    }

    return rule.delay;
  } catch (error) {
    console.warn('getDelay', error);

    return DEFAULT_DELAY;
  }
}

/**
 * @returns {Promise<Array<{ url: string; delay: string }>>} key is url, value is delay
 */
async function getRules() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['rules'], (items) => {
      resolve(items.rules);
    });
  });
}
