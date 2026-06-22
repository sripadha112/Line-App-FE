(function (window) {
    const ID_QUERY_PREFIX = 'qid_';
    const ID_QUERY_KEY = 'KEDULZ_QUERY_ID_V1';

    function xorWithKey(value) {
        let output = '';
        for (let i = 0; i < value.length; i += 1) {
            output += String.fromCharCode(value.charCodeAt(i) ^ ID_QUERY_KEY.charCodeAt(i % ID_QUERY_KEY.length));
        }
        return output;
    }

    function toBase64Url(value) {
        return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function fromBase64Url(value) {
        const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
        return atob(base64 + padding);
    }

    function encryptQueryValue(value) {
        if (value === null || value === undefined || value === '') return '';
        return ID_QUERY_PREFIX + toBase64Url(xorWithKey('v1:' + String(value)));
    }

    function decryptQueryValue(value) {
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

    window.QueryParamCrypto = {
        encryptQueryValue,
        decryptQueryValue,
        encryptQueryId: encryptQueryValue,
        decryptQueryId: decryptQueryValue
    };
})(window);
