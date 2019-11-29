// chrome-extension://mgdjhhejjfeipeljfoheogagpjlccoij/options.html

{
  const DEFAULT_RULES = [
    {
      delay: 400,
      url: 'https://developer.mozilla.org/',
    },
    {
      delay: 500,
      url: 'https://stackoverflow.com/',
    }
  ];

  const textarea = document.getElementById('rules');
  const ENTER_PRESSED = 'enter-pressed';
  const myCodeMirror = window.CodeMirror.fromTextArea(textarea, {
    lineNumbers: true,
    mode: "javascript",
  });

  main();

  async function main() {
    bindEvents();
    $('.toast').toast({ delay: 1500 });

    myCodeMirror.setValue(JSON.stringify(await getInitialRules(), null, 2));
  }

  function bindEvents() {
    document.getElementById('save-btn').addEventListener('click', async () => {
      const value = myCodeMirror.getValue();
      let rules;

      try {
        rules = JSON.parse(value);

        await saveRules(rules);
      } catch (error) {
        showErrorToast();
        return console.warn('Invalid JSON', error);
      }

      console.log('rules:', rules);

      showToast();
    });
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
   * @returns {Promise<Array<{ url: string; delay: string }>>} key is url, value is delay
   */
  async function getRules() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['rules'], (items) => {
        resolve(items.rules);
      });
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

  async function getInitialRules() {
    let initialRules = DEFAULT_RULES;

    try {
      initialRules = await getRules() || DEFAULT_RULES;
    } catch (error) {
      console.warn('getRules', error);
    }

    return initialRules;
  }

}
