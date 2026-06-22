const ID_QUERY_PREFIX = 'qid_';
const ID_QUERY_KEY = 'KEDULZ_QUERY_ID_V1';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(input) {
  let output = '';
  let i = 0;

  while (i < input.length) {
    const c1 = input.charCodeAt(i++) & 0xff;
    const c2 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;
    const c3 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;

    output += BASE64_CHARS[c1 >> 2];
    output += BASE64_CHARS[((c1 & 3) << 4) | ((c2 || 0) >> 4)];
    output += Number.isNaN(c2) ? '=' : BASE64_CHARS[((c2 & 15) << 2) | ((c3 || 0) >> 6)];
    output += Number.isNaN(c3) ? '=' : BASE64_CHARS[c3 & 63];
  }

  return output;
}

function fromBase64(input) {
  const cleaned = input.replace(/[^A-Za-z0-9+/=]/g, '');
  let output = '';

  for (let i = 0; i < cleaned.length;) {
    const e1 = BASE64_CHARS.indexOf(cleaned.charAt(i++));
    const e2 = BASE64_CHARS.indexOf(cleaned.charAt(i++));
    const e3 = BASE64_CHARS.indexOf(cleaned.charAt(i++));
    const e4 = BASE64_CHARS.indexOf(cleaned.charAt(i++));

    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;

    output += String.fromCharCode(c1);
    if (e3 !== 64 && e3 !== -1) output += String.fromCharCode(c2);
    if (e4 !== 64 && e4 !== -1) output += String.fromCharCode(c3);
  }

  return output;
}

function xorWithKey(value) {
  let output = '';

  for (let i = 0; i < value.length; i += 1) {
    output += String.fromCharCode(value.charCodeAt(i) ^ ID_QUERY_KEY.charCodeAt(i % ID_QUERY_KEY.length));
  }

  return output;
}

function toBase64Url(value) {
  return toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
  return fromBase64(base64 + padding);
}

export function encryptQueryValue(value) {
  if (value === null || value === undefined || value === '') return '';
  const plaintext = `v1:${String(value)}`;
  return `${ID_QUERY_PREFIX}${toBase64Url(xorWithKey(plaintext))}`;
}

export function decryptQueryValue(value) {
  if (value === null || value === undefined || value === '') return value;
  const raw = String(value);

  if (!raw.startsWith(ID_QUERY_PREFIX)) {
    return raw;
  }

  const decoded = xorWithKey(fromBase64Url(raw.slice(ID_QUERY_PREFIX.length)));
  if (!decoded.startsWith('v1:')) {
    throw new Error('Invalid encrypted query id');
  }

  return decoded.slice(3);
}

export const encryptQueryId = encryptQueryValue;
export const decryptQueryId = decryptQueryValue;
