/*
 * Shared configuration for the two embed demos (/widget and /iframe).
 *
 * Both demos read the same values, so one deploy can target any account/user
 * without an edit:
 *   ?base=https://booking.dev.zocks.io&account=zocks&user=…&eventType=…
 *     [&brandColor=%23b91c1c][&hideLogo=1][&hideAccountName=1][&hideProfilePhoto=1]
 *
 * `base` is the origin of the booking app. /iframe frames `base/{account}/{user}`;
 * /widget loads `base/embed/v1.js`. Point it at http://localhost:3000 to test
 * against a local `pnpm build:widget && pnpm dev`.
 */
(function () {
  const FIELDS = {
    base: {
      label: 'Booking site',
      value: 'https://booking.dev.zocks.io',
      type: 'url',
      required: true,
    },
    account: { label: 'Account', value: 'zocks', required: true },
    user: { label: 'User', value: 'imre-dobos-0y0ca2wqgr4ugypm', required: true },
    eventType: { label: 'Event type (optional)', value: '', required: false },
    // Widget only. Blank leaves the widget's own default (560px) in place.
    minHeight: { label: 'Min height (optional)', value: '', required: false },
    // Branding overrides, forwarded to the booking page. Hide-only + recolor:
    // the page never accepts host-supplied logo/name content, and account
    // settings still win — these can hide more, never reveal.
    brandColor: {
      label: 'Brand color (hex, optional)',
      value: '',
      required: false,
    },
    hideLogo: { label: 'Hide logo', value: '', type: 'checkbox' },
    hideAccountName: { label: 'Hide account name', value: '', type: 'checkbox' },
    hideProfilePhoto: {
      label: 'Hide profile photo',
      value: '',
      type: 'checkbox',
    },
  };

  const params = new URLSearchParams(window.location.search);

  const config = {};
  for (const [key, field] of Object.entries(FIELDS)) {
    config[key] = (params.get(key) || field.value).trim();
  }
  config.base = config.base.replace(/\/+$/, '');

  // The booking app routes on /{account}/{user}. For the plain iframe the
  // branding overrides ride the frame URL directly (the widget builds its own
  // URL from the options instead).
  const overrides = new URLSearchParams();
  if (config.brandColor) overrides.set('brandColor', config.brandColor);
  for (const flag of ['hideLogo', 'hideAccountName', 'hideProfilePhoto']) {
    if (config[flag] === '1') overrides.set(flag, '1');
  }
  const overrideQuery = overrides.toString();
  config.bookingUrl =
    `${config.base}/${encodeURIComponent(config.account)}/${encodeURIComponent(config.user)}` +
    (overrideQuery ? `?${overrideQuery}` : '');
  config.widgetScriptUrl = `${config.base}/embed/v1.js`;

  /* Renders the "demo settings" panel into `container`, showing only `names`
   * and pre-filled with the config in effect. Applying reloads the page with
   * the values as query params, which is what the block above reads. */
  function mountSettings(container, names) {
    const inputs = names
      .map((name) => {
        const field = FIELDS[name];
        if (field.type === 'checkbox') {
          return `
          <div class="check">
            <label for="cfg-${name}">
              <input id="cfg-${name}" name="${name}" type="checkbox">
              ${field.label}
            </label>
          </div>`;
        }
        return `
          <div>
            <label for="cfg-${name}">${field.label}</label>
            <input id="cfg-${name}" name="${name}" spellcheck="false"
                   type="${field.type || 'text'}" ${field.required ? 'required' : ''}>
          </div>`;
      })
      .join('');

    container.innerHTML = `
      <details class="settings card">
        <summary>Demo settings</summary>
        <form>
          ${inputs}
          <div class="actions">
            <button type="submit">Apply</button>
            <a class="reset" href="${window.location.pathname}">Reset</a>
          </div>
        </form>
      </details>`;

    const form = container.querySelector('form');
    for (const name of names) {
      const input = form.elements[name];
      if (FIELDS[name].type === 'checkbox') {
        input.checked = config[name] === '1';
      } else {
        input.value = config[name];
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = new URLSearchParams();
      for (const name of names) {
        const input = form.elements[name];
        const value =
          FIELDS[name].type === 'checkbox'
            ? input.checked
              ? '1'
              : ''
            : input.value.trim();
        // Keep the URL clean: only carry values that differ from the defaults.
        if (value && value !== FIELDS[name].value) next.set(name, value);
      }
      const query = next.toString();
      window.location.search = query ? `?${query}` : '';
    });
  }

  window.ZocksDemo = { FIELDS, config, mountSettings };
})();
