const DEFAULT_DELAY = 1000;
const contentScriptRunAt = Date.now();
const TRANSLATE_MODES = mirror('APPEND', 'OVERWRITE');
const DEFAULT_MODE = TRANSLATE_MODES.OVERWRITE;

async function main() {
  // console.log('document:', document.readyState);

  // console.time('getRule')
  const rule = await getRule();
  // console.timeEnd('getRule')

  // console.log('rule:', rule);

  // not run
  if (!rule || rule.disabled) {
    console.group('🐬.crx', chrome.extension.getURL('options.html'))
    console.log('No rule found or not enabled for current window. Dolphin switched off.');
    console.groupEnd();

    return;
  };

  const userSetDelay = rule.delay;
  // console.log('document:', document.readyState);

  // if `onLoad` has been fired after `getRule`
  if (document.readyState === 'complete') {
    onLoad(userSetDelay);
  } else {
    // not fired register `onLoad`.
    // and wait for all the async request completed then do the decode
    window.addEventListener('load', () => onLoad(userSetDelay));
  }
}

main();

async function onLoad(userSetDelay) {
  const onloadOffset = Date.now() - contentScriptRunAt;
  const mode = await getTranslateMode();

  // decode ASAP after onLoad
  if (typeof userSetDelay === 'undefined') {
    decode(onloadOffset, mode);
  } else {
    // user set delay is much bigger than `onloadOffset`, then re-`decode`
    if (userSetDelay - onloadOffset > 100) {
      setTimeout(() => decode(userSetDelay), userSetDelay);
    } else {
      decode(onloadOffset, mode);
    }
  }
}

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

function decode(delay, translateMode) {
  const textNodes = findAllTextNodes(document.body);
  const encodedTextNodes = textNodes.filter(({ textContent }) => isEncoded(textContent));

  encodedTextNodes.forEach(textNode => {
    textNode.textContent = (translateMode === TRANSLATE_MODES.APPEND ? textNode.textContent : '')
      + `🐬` + decodeURIComponent(textNode.textContent) + '🐬';
  });

  chrome.runtime.sendMessage({
    type: 'UPDATE_BADGE_TEXT',
    payload: { text: String(encodedTextNodes.length) }
  });

  console.group('🐬.crx', chrome.extension.getURL('options.html'))
  log('After', delay, 'ms, the async rendering is expected to be complete.');
  log('Find', textNodes.length, 'textNode(s).');
  log(
    '%c%d', 'color:blue;', encodedTextNodes.length,
    'textNode(s) `decodeURIComponent`ed.',
    `Translate mode: ${translateMode}.`,
  );
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

async function getRule() {
  const href = window.location.href;

  const rules = await getRules();
  const rule = rules.find(rule => href.startsWith(rule.url))

  if (!rule) {
    return null;
  }

  return rule;
}

async function getTranslateMode() {
  return new Promise(resolve => {
    try {
      chrome.storage.sync.get({ translateMode: DEFAULT_MODE }, (items) => {
        resolve(items.translateMode);
      });
    } catch (error) {
      console.log('getTranslateMode', error);

      resolve(DEFAULT_MODE)
    }
  });
}

/**
 * @returns {Promise<Array<{ url: string; delay: string; disabled: boolean }>>} key is url, value is delay
 */
async function getRules() {
  const DEFAULT_RULES = [
    {
      url: 'http://',
      disabled: false,
    },
    {
      url: 'https://',
      disabled: false,
    }
  ];

  return new Promise(resolve => {
    chrome.storage.sync.get({ rules: DEFAULT_RULES }, (items) => {
      resolve(items.rules);
    });
  });
}

/**
 * @param  {...string} args
 * @returns {Record<string, string>}
 */
function mirror(...args) {
  return args.reduce((acc, key) => ({ ...acc, [key]: key }), {})
}
