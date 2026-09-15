/*
 * Shared configuration for the two embed demos (/widget and /iframe).
 *
 * Both demos read the same values, so one deploy can target any booking page
 * without an edit:
 *   ?url=https://booking.dev.zocks.io/zocks/…
 *     [&brandColor=%23b91c1c][&hideLogo=1][&hideAccountName=1][&hideProfilePhoto=1]
 *
 * `url` is the booking page link, exactly as copied from the browser — an
 * account-wide link (…/zocks), an advisor link, or an event-type link all
 * work, and a scheduling-link `?l=` is carried through. /iframe frames the
 * link directly; /widget loads `<link origin>/embed/v1.js` and hands the link
 * to Zocks.initWidget(). Point it at http://localhost:3000/… to test against
 * a local `pnpm dev`.
 */
(function () {
  const FIELDS = {
    url: {
      label: 'Booking page link',
      value: 'https://booking.dev.zocks.io/zocks/imre-dobos-0y0ca2wqgr4ugypm',
      type: 'url',
      required: true,
    },
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
      required: false,
      type: 'checkbox',
    },
  };

  const params = new URLSearchParams(window.location.search);

  const config = {};
  for (const [key, field] of Object.entries(FIELDS)) {
    config[key] = (params.get(key) || field.value).trim();
  }

  // The widget script is served by the booking app itself, so its origin
  // comes from the pasted link.
  let bookingOrigin = '';
  try {
    bookingOrigin = new URL(config.url).origin;
  } catch {
    // Leave empty; the pages surface the bad link themselves.
  }
  config.widgetScriptUrl = bookingOrigin ? `${bookingOrigin}/embed/v1.js` : '';

  // For the plain iframe the branding overrides ride the frame URL directly
  // (the widget builds its own URL from the options instead).
  config.bookingUrl = config.url;
  try {
    const frameUrl = new URL(config.url);
    if (config.brandColor) {
      frameUrl.searchParams.set('brandColor', config.brandColor);
    }
    for (const flag of ['hideLogo', 'hideAccountName', 'hideProfilePhoto']) {
      if (config[flag] === '1') frameUrl.searchParams.set(flag, '1');
    }
    config.bookingUrl = frameUrl.toString();
  } catch {
    // Keep the raw value; the browser will show its own error for a bad src.
  }

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
