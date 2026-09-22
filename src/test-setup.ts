import '@testing-library/jest-dom/vitest';

// jsdom implements no layout, so Element.scrollIntoView (used by Item.tsx to
// keep the newest message visible) doesn't exist at all — stub it so tests
// don't crash on an API every real browser has.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
