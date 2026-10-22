// Angular's native unit-test builder initializes TestBed with strict unknown
// element/property checks. Do not initialize it a second time here.
// jsdom has no layout engine and does not implement innerText. The external-link
// directive reads it from plain-text footer links to build their aria-labels.
// textContent is sufficient for these fixtures, not a rendered-layout substitute.
if (!('innerText' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'innerText', {
    configurable: true,
    get() {
      return this.textContent;
    },
    set(value: string) {
      this.textContent = value;
    },
  });
}
