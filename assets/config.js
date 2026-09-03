/*
 * Shared configuration for the two embed demos (/widget and /iframe).
 *
 * Both demos read the same values, so one deploy can target any account/user
 * without an edit:
 *   ?base=https://booking.dev.zocks.io&account=zocks&user=…&eventType=…
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
  };

  const params = new URLSearchParams(window.location.search);

  const config = {};
  for (const [key, field] of Object.entries(FIELDS)) {
    config[key] = (params.get(key) || field.value).trim();
  }
  config.base = config.base.replace(/\/+$/, '');

  // The booking app routes on /{account}/{user}.
  config.bookingUrl =
    `${config.base}/${encodeURIComponent(config.account)}/${encodeURIComponent(config.user)}`;
  config.widgetScriptUrl = `${config.base}/embed/v1.js`;

  /* Renders the "demo settings" panel into `container`, showing only `names`
   * and pre-filled with the config in effect. Applying reloads the page with
   * the values as query params, which is what the block above reads. */
  function mountSettings(container, names) {
    const inputs = names
      .map((name) => {
        const field = FIELDS[name];
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
      form.elements[name].value = config[name];
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = new URLSearchParams();
      for (const name of names) {
        const value = form.elements[name].value.trim();
        // Keep the URL clean: only carry values that differ from the defaults.
        if (value && value !== FIELDS[name].value) next.set(name, value);
      }
      const query = next.toString();
      window.location.search = query ? `?${query}` : '';
    });
  }

  window.ZocksDemo = { FIELDS, config, mountSettings };
})();
