const P = {
  back: '<path d="m9 6 6 6-6 6"/>',
  cart: '<path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  phone: '<path d="M5 4h3l1.5 4-2 1.3a11 11 0 0 0 7.2 7.2L16 14.5l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.1 4.3 6.3C19.5 15.4 12 20 12 20z"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  offers: '<path d="m12 2.8 2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L12 21.2l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1z"/><path d="m9 15 6-6"/><circle cx="9.5" cy="9.5" r=".6"/><circle cx="14.5" cy="14.5" r=".6"/>',
  user: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.2a6.5 6.5 0 0 1 11 0"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.3 10.8 7.4-4.1M8.3 13.2l7.4 4.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  sparkle: '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/><path d="M19 15c.2 1.6 1 2.4 2.5 2.6-1.5.2-2.3 1-2.5 2.6-.2-1.6-1-2.4-2.5-2.6 1.5-.2 2.3-1 2.5-2.6z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  map: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  nav: '<path d="m3 11 18-8-8 18-2-8z"/>',
  chat: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  // أيقونات الأقسام
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  brush: '<path d="M14 3h6v6l-7.5 7.5-6-6z"/><path d="M6.5 10.5 3 14c-1 1 0 4 2 5s4 2 5 1l3.5-3.5"/>',
  faucet: '<path d="M4 9h9a4 4 0 0 1 4 4v1h3v3h-6v-3a1 1 0 0 0-1-1H4z"/><path d="M8 9V5h3v4M6 5h7"/><path d="M18.5 19.5v1.5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-2-2 6.3-6.3a4 4 0 0 1-5-5L9 4.5 11.5 2z"/><path d="M3 21l6-6"/>',
  lock: '<rect x="6.5" y="11" width="11" height="10" rx="1.6"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/><circle cx="12" cy="16.2" r="1"/>',
  pipe: '<path d="M3 7h10a4 4 0 0 1 4 4v10"/><path d="M3 12h8a1 1 0 0 1 1 1v8"/><path d="M3 5v9M10 19h9"/>',
  saw: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  car: '<path d="M5 16V12l2-5h10l2 5v4z"/><path d="M5 12h14"/><circle cx="8" cy="16.5" r="1.5"/><circle cx="16" cy="16.5" r="1.5"/>',
  snow: '<path d="M12 2v20M4 6.5l16 11M20 6.5l-16 11"/><path d="m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  fire: '<rect x="8" y="8" width="8" height="13" rx="3"/><path d="M12 8V5h3l3-2M10 5h5"/><path d="M10.5 13h3"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
  tube: '<path d="M8 3h8v3l-1 1v11a3 3 0 0 1-6 0V7L8 6z"/><path d="M10 11h4"/>',
  pump: '<rect x="3" y="8" width="11" height="9" rx="2"/><path d="M14 11h4v3h-4M18 9v7M6 17v3M11 17v3M7 8V5h3v3"/>',
  brick: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
};

export function icon(name, cls = 'ico') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', cls);
  s.innerHTML = P[name] || '';
  return s;
}
