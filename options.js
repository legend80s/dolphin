// chrome-extension://mgdjhhejjfeipeljfoheogagpjlccoij/options.html

{
  const RULES_PLACEHOLDER = [
    {
      url: 'http://',
      disabled: false,
    },
    {
      url: 'https://',
      disabled: false,
    }
  ];

  const textarea = document.getElementById('rules');
  const ENTER_PRESSED = 'enter-pressed';
  const myCodeMirror = window.CodeMirror.fromTextArea(textarea, {
    mode: "javascript",
    lineNumbers: true,
    lineWrapping: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: {
      'Ctrl-S': cm => tryToSaveRules(cm),
      'Cmd-S': cm => tryToSaveRules(cm),
    },
  });

  main();

  async function main() {
    bindEvents();
    $('.toast').toast({ delay: 1500 });

    showRules(myCodeMirror);
  }

  async function showRules(cm) {
    const rules = await getRules() || RULES_PLACEHOLDER;

    cm.setValue(JSON.stringify(rules, null, 2));
  }

  function bindEvents() {
    let newRuleCount = 0;

    // add new rule
    document.getElementById('add-btn').addEventListener('click', () => {
      const newRule = { delay: 1000, url: `https://example${newRuleCount ? newRuleCount : ''}.com` };

      const parsedRules = parseJSON(myCodeMirror.getValue());
      const existingRules = Array.isArray(parsedRules) ? parsedRules : [];

      myCodeMirror.setValue(
        JSON.stringify(
          [newRule].concat(
            existingRules
          ),
          null,
          2
        )
      );

      ++newRuleCount;
    });

    // save rules
    document.getElementById('save-btn').addEventListener('click', () => tryToSaveRules(myCodeMirror));
  }

  function parseJSON(jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.log(`JSON.parse "${jsonStr}" error`, error);

      return jsonStr;
    }
  }

  function myAddEventListener(element, eventNames, handler) {
    const MAPPING = {
      [ENTER_PRESSED]: 'keypress',
    };

    eventNames.split('|').forEach(eventName => {
      if (eventName !== ENTER_PRESSED) {
        element.addEventListener(eventName, handler);

        return;
      }

      element.addEventListener(MAPPING[ENTER_PRESSED], (event, ...rest) => {
        const key = event.which || event.keyCode;
        // 13 is enter key
        const ENTER_KEY_CODE = 13;

        if (key === ENTER_KEY_CODE) {
          handler(event, ...rest);
        }
      });
    });
  }

  /**
   * @param {CodeMirror} codeMirror
   */
  async function tryToSaveRules(codeMirror) {
    const value = codeMirror.getValue().trim();
    let rules;

    try {
      rules = value ? JSON.parse(value) : RULES_PLACEHOLDER.map(rule => ({ ...rule, disabled: true }));

      await saveRules(rules);
    } catch (error) {
      showErrorToast();

      return console.warn('Invalid JSON', error);
    }

    console.log('rules:', rules);

    showToast();
  }

  /**
   * @returns {Promise<Array<{ url: string; delay: string; disabled: boolean }>>} key is url, value is delay
   */
  async function getRules() {
    return new Promise(resolve => {
      try {
          chrome.storage.sync.get(['rules'], (items) => {
          resolve(items.rules);
        });
      } catch (error) {
        console.warn('getRules', error);

        resolve('')
      }
    });
  }

  /**
   *
   * @param {Array<{ url: string; delay: string }>} rules
   */
  async function saveRules(rules) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ rules }, (...args) => {
        resolve(...args);
      });
    });
  }

  function showToast() {
    $('#save-delay-toast').toast('show');
  }

  function showErrorToast() {
    $('#save-delay-error-toast').toast('show');
  }
}
