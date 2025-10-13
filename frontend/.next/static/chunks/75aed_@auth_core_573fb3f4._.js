(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/cookie.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SessionStore",
    ()=>SessionStore,
    "defaultCookies",
    ()=>defaultCookies
]);
var __classPrivateFieldSet = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SessionStore_instances, _SessionStore_chunks, _SessionStore_option, _SessionStore_logger, _SessionStore_chunk, _SessionStore_clean;
// Uncomment to recalculate the estimated size
// of an empty session cookie
// import * as cookie from "../vendored/cookie.js"
// const { serialize } = cookie
// console.log(
//   "Cookie estimated to be ",
//   serialize(`__Secure.authjs.session-token.0`, "", {
//     expires: new Date(),
//     httpOnly: true,
//     maxAge: Number.MAX_SAFE_INTEGER,
//     path: "/",
//     sameSite: "strict",
//     secure: true,
//     domain: "example.com",
//   }).length,
//   " bytes"
// )
const ALLOWED_COOKIE_SIZE = 4096;
// Based on commented out section above
const ESTIMATED_EMPTY_COOKIE_SIZE = 160;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;
function defaultCookies(useSecureCookies) {
    const cookiePrefix = useSecureCookies ? "__Secure-" : "";
    return {
        // default cookie options
        sessionToken: {
            name: "".concat(cookiePrefix, "authjs.session-token"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies
            }
        },
        callbackUrl: {
            name: "".concat(cookiePrefix, "authjs.callback-url"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies
            }
        },
        csrfToken: {
            // Default to __Host- for CSRF token for additional protection if using useSecureCookies
            // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
            name: "".concat(useSecureCookies ? "__Host-" : "", "authjs.csrf-token"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies
            }
        },
        pkceCodeVerifier: {
            name: "".concat(cookiePrefix, "authjs.pkce.code_verifier"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                maxAge: 60 * 15
            }
        },
        state: {
            name: "".concat(cookiePrefix, "authjs.state"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                maxAge: 60 * 15
            }
        },
        nonce: {
            name: "".concat(cookiePrefix, "authjs.nonce"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies
            }
        },
        webauthnChallenge: {
            name: "".concat(cookiePrefix, "authjs.challenge"),
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                maxAge: 60 * 15
            }
        }
    };
}
class SessionStore {
    /**
     * The JWT Session or database Session ID
     * constructed from the cookie chunks.
     */ get value() {
        // Sort the chunks by their keys before joining
        const sortedKeys = Object.keys(__classPrivateFieldGet(this, _SessionStore_chunks, "f")).sort((a, b)=>{
            const aSuffix = parseInt(a.split(".").pop() || "0");
            const bSuffix = parseInt(b.split(".").pop() || "0");
            return aSuffix - bSuffix;
        });
        // Use the sorted keys to join the chunks in the correct order
        return sortedKeys.map((key)=>__classPrivateFieldGet(this, _SessionStore_chunks, "f")[key]).join("");
    }
    /**
     * Given a cookie value, return new cookies, chunked, to fit the allowed cookie size.
     * If the cookie has changed from chunked to unchunked or vice versa,
     * it deletes the old cookies as well.
     */ chunk(value, options) {
        // Assume all cookies should be cleaned by default
        const cookies = __classPrivateFieldGet(this, _SessionStore_instances, "m", _SessionStore_clean).call(this);
        // Calculate new chunks
        const chunked = __classPrivateFieldGet(this, _SessionStore_instances, "m", _SessionStore_chunk).call(this, {
            name: __classPrivateFieldGet(this, _SessionStore_option, "f").name,
            value,
            options: {
                ...__classPrivateFieldGet(this, _SessionStore_option, "f").options,
                ...options
            }
        });
        // Update stored chunks / cookies
        for (const chunk of chunked){
            cookies[chunk.name] = chunk;
        }
        return Object.values(cookies);
    }
    /** Returns a list of cookies that should be cleaned. */ clean() {
        return Object.values(__classPrivateFieldGet(this, _SessionStore_instances, "m", _SessionStore_clean).call(this));
    }
    constructor(option, cookies, logger){
        _SessionStore_instances.add(this);
        _SessionStore_chunks.set(this, {});
        _SessionStore_option.set(this, void 0);
        _SessionStore_logger.set(this, void 0);
        __classPrivateFieldSet(this, _SessionStore_logger, logger, "f");
        __classPrivateFieldSet(this, _SessionStore_option, option, "f");
        if (!cookies) return;
        const { name: sessionCookiePrefix } = option;
        for (const [name, value] of Object.entries(cookies)){
            if (!name.startsWith(sessionCookiePrefix) || !value) continue;
            __classPrivateFieldGet(this, _SessionStore_chunks, "f")[name] = value;
        }
    }
}
_SessionStore_chunks = new WeakMap(), _SessionStore_option = new WeakMap(), _SessionStore_logger = new WeakMap(), _SessionStore_instances = new WeakSet(), _SessionStore_chunk = function _SessionStore_chunk(cookie) {
    const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE);
    if (chunkCount === 1) {
        __classPrivateFieldGet(this, _SessionStore_chunks, "f")[cookie.name] = cookie.value;
        return [
            cookie
        ];
    }
    const cookies = [];
    for(let i = 0; i < chunkCount; i++){
        const name = "".concat(cookie.name, ".").concat(i);
        const value = cookie.value.substr(i * CHUNK_SIZE, CHUNK_SIZE);
        cookies.push({
            ...cookie,
            name,
            value
        });
        __classPrivateFieldGet(this, _SessionStore_chunks, "f")[name] = value;
    }
    __classPrivateFieldGet(this, _SessionStore_logger, "f").debug("CHUNKING_SESSION_COOKIE", {
        message: "Session cookie exceeds allowed ".concat(ALLOWED_COOKIE_SIZE, " bytes."),
        emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
        valueSize: cookie.value.length,
        chunks: cookies.map((c)=>c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE)
    });
    return cookies;
}, _SessionStore_clean = function _SessionStore_clean() {
    const cleanedChunks = {};
    for(const name in __classPrivateFieldGet(this, _SessionStore_chunks, "f")){
        var __classPrivateFieldGet1;
        (__classPrivateFieldGet1 = __classPrivateFieldGet(this, _SessionStore_chunks, "f")) === null || __classPrivateFieldGet1 === void 0 ? true : delete __classPrivateFieldGet1[name];
        cleanedChunks[name] = {
            name,
            value: "",
            options: {
                ...__classPrivateFieldGet(this, _SessionStore_option, "f").options,
                maxAge: 0
            }
        };
    }
    return cleanedChunks;
};
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/assert.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertConfig",
    ()=>assertConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/cookie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
;
;
let warned = false;
function isValidHttpUrl(url, baseUrl) {
    try {
        return /^https?:/.test(new URL(url, url.startsWith("/") ? baseUrl : undefined).protocol);
    } catch (e) {
        return false;
    }
}
function isSemverString(version) {
    return /^v\d+(?:\.\d+){0,2}$/.test(version);
}
let hasCredentials = false;
let hasEmail = false;
let hasWebAuthn = false;
const emailMethods = [
    "createVerificationToken",
    "useVerificationToken",
    "getUserByEmail"
];
const sessionMethods = [
    "createUser",
    "getUser",
    "getUserByEmail",
    "getUserByAccount",
    "updateUser",
    "linkAccount",
    "createSession",
    "getSessionAndUser",
    "updateSession",
    "deleteSession"
];
const webauthnMethods = [
    "createUser",
    "getUser",
    "linkAccount",
    "getAccount",
    "getAuthenticator",
    "createAuthenticator",
    "listAuthenticatorsByUserId",
    "updateAuthenticatorCounter"
];
function assertConfig(request, options) {
    var _options_secret, _request_query, _options_cookies_callbackUrl, _options_cookies, _request_cookies;
    const { url } = request;
    const warnings = [];
    if (!warned && options.debug) warnings.push("debug-enabled");
    if (!options.trustHost) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UntrustedHost"]("Host must be trusted. URL was: ".concat(request.url));
    }
    if (!((_options_secret = options.secret) === null || _options_secret === void 0 ? void 0 : _options_secret.length)) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingSecret"]("Please define a `secret`");
    }
    const callbackUrlParam = (_request_query = request.query) === null || _request_query === void 0 ? void 0 : _request_query.callbackUrl;
    if (callbackUrlParam && !isValidHttpUrl(callbackUrlParam, url.origin)) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCallbackUrl"]("Invalid callback URL. Received: ".concat(callbackUrlParam));
    }
    var _options_useSecureCookies;
    const { callbackUrl: defaultCallbackUrl } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultCookies"])((_options_useSecureCookies = options.useSecureCookies) !== null && _options_useSecureCookies !== void 0 ? _options_useSecureCookies : url.protocol === "https:");
    var _options_cookies_callbackUrl_name;
    const callbackUrlCookie = (_request_cookies = request.cookies) === null || _request_cookies === void 0 ? void 0 : _request_cookies[(_options_cookies_callbackUrl_name = (_options_cookies = options.cookies) === null || _options_cookies === void 0 ? void 0 : (_options_cookies_callbackUrl = _options_cookies.callbackUrl) === null || _options_cookies_callbackUrl === void 0 ? void 0 : _options_cookies_callbackUrl.name) !== null && _options_cookies_callbackUrl_name !== void 0 ? _options_cookies_callbackUrl_name : defaultCallbackUrl.name];
    if (callbackUrlCookie && !isValidHttpUrl(callbackUrlCookie, url.origin)) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCallbackUrl"]("Invalid callback URL. Received: ".concat(callbackUrlCookie));
    }
    // Keep track of webauthn providers that use conditional UI
    let hasConditionalUIProvider = false;
    for (const p of options.providers){
        var _provider_options;
        const provider = typeof p === "function" ? p() : p;
        var _provider_issuer;
        if ((provider.type === "oauth" || provider.type === "oidc") && !((_provider_issuer = provider.issuer) !== null && _provider_issuer !== void 0 ? _provider_issuer : (_provider_options = provider.options) === null || _provider_options === void 0 ? void 0 : _provider_options.issuer)) {
            const { authorization: a, token: t, userinfo: u } = provider;
            let key;
            if (typeof a !== "string" && !(a === null || a === void 0 ? void 0 : a.url)) key = "authorization";
            else if (typeof t !== "string" && !(t === null || t === void 0 ? void 0 : t.url)) key = "token";
            else if (typeof u !== "string" && !(u === null || u === void 0 ? void 0 : u.url)) key = "userinfo";
            if (key) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidEndpoints"]('Provider "'.concat(provider.id, '" is missing both `issuer` and `').concat(key, "` endpoint config. At least one of them is required"));
            }
        }
        if (provider.type === "credentials") hasCredentials = true;
        else if (provider.type === "email") hasEmail = true;
        else if (provider.type === "webauthn") {
            hasWebAuthn = true;
            // Validate simpleWebAuthnBrowserVersion
            if (provider.simpleWebAuthnBrowserVersion && !isSemverString(provider.simpleWebAuthnBrowserVersion)) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]('Invalid provider config for "'.concat(provider.id, '": simpleWebAuthnBrowserVersion "').concat(provider.simpleWebAuthnBrowserVersion, '" must be a valid semver string.'));
            }
            if (provider.enableConditionalUI) {
                // Make sure only one webauthn provider has "enableConditionalUI" set to true
                if (hasConditionalUIProvider) {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DuplicateConditionalUI"]("Multiple webauthn providers have 'enableConditionalUI' set to True. Only one provider can have this option enabled at a time");
                }
                hasConditionalUIProvider = true;
                // Make sure at least one formField has "webauthn" in its autocomplete param
                const hasWebauthnFormField = Object.values(provider.formFields).some((f)=>f.autocomplete && f.autocomplete.toString().indexOf("webauthn") > -1);
                if (!hasWebauthnFormField) {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingWebAuthnAutocomplete"]('Provider "'.concat(provider.id, "\" has 'enableConditionalUI' set to True, but none of its formFields have 'webauthn' in their autocomplete param"));
                }
            }
        }
    }
    if (hasCredentials) {
        var _options_session;
        const dbStrategy = ((_options_session = options.session) === null || _options_session === void 0 ? void 0 : _options_session.strategy) === "database";
        const onlyCredentials = !options.providers.some((p)=>(typeof p === "function" ? p() : p).type !== "credentials");
        if (dbStrategy && onlyCredentials) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnsupportedStrategy"]("Signing in with credentials only supported if JWT strategy is enabled");
        }
        const credentialsNoAuthorize = options.providers.some((p)=>{
            const provider = typeof p === "function" ? p() : p;
            return provider.type === "credentials" && !provider.authorize;
        });
        if (credentialsNoAuthorize) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingAuthorize"]("Must define an authorize() handler to use credentials authentication provider");
        }
    }
    const { adapter, session } = options;
    const requiredMethods = [];
    if (hasEmail || (session === null || session === void 0 ? void 0 : session.strategy) === "database" || !(session === null || session === void 0 ? void 0 : session.strategy) && adapter) {
        if (hasEmail) {
            if (!adapter) return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingAdapter"]("Email login requires an adapter");
            requiredMethods.push(...emailMethods);
        } else {
            if (!adapter) return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingAdapter"]("Database session requires an adapter");
            requiredMethods.push(...sessionMethods);
        }
    }
    if (hasWebAuthn) {
        var _options_experimental;
        // Log experimental warning
        if ((_options_experimental = options.experimental) === null || _options_experimental === void 0 ? void 0 : _options_experimental.enableWebAuthn) {
            warnings.push("experimental-webauthn");
        } else {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExperimentalFeatureNotEnabled"]("WebAuthn is an experimental feature. To enable it, set `experimental.enableWebAuthn` to `true` in your config");
        }
        if (!adapter) return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingAdapter"]("WebAuthn requires an adapter");
        requiredMethods.push(...webauthnMethods);
    }
    if (adapter) {
        const missing = requiredMethods.filter((m)=>!(m in adapter));
        if (missing.length) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingAdapterMethods"]("Required adapter methods were missing: ".concat(missing.join(", ")));
        }
    }
    if (!warned) warned = true;
    return warnings;
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/vendored/cookie.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @source https://github.com/jshttp/cookie
 * @author blakeembrey
 * @license MIT
 */ /**
 * This is a workaround to support ESM-only environments, until `cookie` ships ESM builds.
 * @see https://github.com/jshttp/cookie/issues/211
 */ /**
 * RegExp to match cookie-name in RFC 6265 sec 4.1.1
 * This refers out to the obsoleted definition of token in RFC 2616 sec 2.2
 * which has been replaced by the token definition in RFC 7230 appendix B.
 *
 * cookie-name       = token
 * token             = 1*tchar
 * tchar             = "!" / "#" / "$" / "%" / "&" / "'" /
 *                     "*" / "+" / "-" / "." / "^" / "_" /
 *                     "`" / "|" / "~" / DIGIT / ALPHA
 */ __turbopack_context__.s([
    "parse",
    ()=>parse,
    "serialize",
    ()=>serialize
]);
const cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
/**
 * RegExp to match cookie-value in RFC 6265 sec 4.1.1
 *
 * cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
 * cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
 *                     ; US-ASCII characters excluding CTLs,
 *                     ; whitespace DQUOTE, comma, semicolon,
 *                     ; and backslash
 */ const cookieValueRegExp = /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;
/**
 * RegExp to match domain-value in RFC 6265 sec 4.1.1
 *
 * domain-value      = <subdomain>
 *                     ; defined in [RFC1034], Section 3.5, as
 *                     ; enhanced by [RFC1123], Section 2.1
 * <subdomain>       = <label> | <subdomain> "." <label>
 * <label>           = <let-dig> [ [ <ldh-str> ] <let-dig> ]
 *                     Labels must be 63 characters or less.
 *                     'let-dig' not 'letter' in the first char, per RFC1123
 * <ldh-str>         = <let-dig-hyp> | <let-dig-hyp> <ldh-str>
 * <let-dig-hyp>     = <let-dig> | "-"
 * <let-dig>         = <letter> | <digit>
 * <letter>          = any one of the 52 alphabetic characters A through Z in
 *                     upper case and a through z in lower case
 * <digit>           = any one of the ten digits 0 through 9
 *
 * Keep support for leading dot: https://github.com/jshttp/cookie/issues/173
 *
 * > (Note that a leading %x2E ("."), if present, is ignored even though that
 * character is not permitted, but a trailing %x2E ("."), if present, will
 * cause the user agent to ignore the attribute.)
 */ const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
/**
 * RegExp to match path-value in RFC 6265 sec 4.1.1
 *
 * path-value        = <any CHAR except CTLs or ";">
 * CHAR              = %x01-7F
 *                     ; defined in RFC 5234 appendix B.1
 */ const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
const __toString = Object.prototype.toString;
const NullObject = /* @__PURE__ */ (()=>{
    const C = function() {};
    C.prototype = Object.create(null);
    return C;
})();
function parse(str, options) {
    const obj = new NullObject();
    const len = str.length;
    // RFC 6265 sec 4.1.1, RFC 2616 2.2 defines a cookie name consists of one char minimum, plus '='.
    if (len < 2) return obj;
    const dec = (options === null || options === void 0 ? void 0 : options.decode) || decode;
    let index = 0;
    do {
        const eqIdx = str.indexOf("=", index);
        if (eqIdx === -1) break; // No more cookie pairs.
        const colonIdx = str.indexOf(";", index);
        const endIdx = colonIdx === -1 ? len : colonIdx;
        if (eqIdx > endIdx) {
            // backtrack on prior semicolon
            index = str.lastIndexOf(";", eqIdx - 1) + 1;
            continue;
        }
        const keyStartIdx = startIndex(str, index, eqIdx);
        const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
        const key = str.slice(keyStartIdx, keyEndIdx);
        // only assign once
        if (obj[key] === undefined) {
            let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
            let valEndIdx = endIndex(str, endIdx, valStartIdx);
            const value = dec(str.slice(valStartIdx, valEndIdx));
            obj[key] = value;
        }
        index = endIdx + 1;
    }while (index < len)
    return obj;
}
function startIndex(str, index, max) {
    do {
        const code = str.charCodeAt(index);
        if (code !== 0x20 /*   */  && code !== 0x09 /* \t */ ) return index;
    }while (++index < max)
    return max;
}
function endIndex(str, index, min) {
    while(index > min){
        const code = str.charCodeAt(--index);
        if (code !== 0x20 /*   */  && code !== 0x09 /* \t */ ) return index + 1;
    }
    return min;
}
function serialize(name, val, options) {
    const enc = (options === null || options === void 0 ? void 0 : options.encode) || encodeURIComponent;
    if (!cookieNameRegExp.test(name)) {
        throw new TypeError("argument name is invalid: ".concat(name));
    }
    const value = enc(val);
    if (!cookieValueRegExp.test(value)) {
        throw new TypeError("argument val is invalid: ".concat(val));
    }
    let str = name + "=" + value;
    if (!options) return str;
    if (options.maxAge !== undefined) {
        if (!Number.isInteger(options.maxAge)) {
            throw new TypeError("option maxAge is invalid: ".concat(options.maxAge));
        }
        str += "; Max-Age=" + options.maxAge;
    }
    if (options.domain) {
        if (!domainValueRegExp.test(options.domain)) {
            throw new TypeError("option domain is invalid: ".concat(options.domain));
        }
        str += "; Domain=" + options.domain;
    }
    if (options.path) {
        if (!pathValueRegExp.test(options.path)) {
            throw new TypeError("option path is invalid: ".concat(options.path));
        }
        str += "; Path=" + options.path;
    }
    if (options.expires) {
        if (!isDate(options.expires) || !Number.isFinite(options.expires.valueOf())) {
            throw new TypeError("option expires is invalid: ".concat(options.expires));
        }
        str += "; Expires=" + options.expires.toUTCString();
    }
    if (options.httpOnly) {
        str += "; HttpOnly";
    }
    if (options.secure) {
        str += "; Secure";
    }
    if (options.partitioned) {
        str += "; Partitioned";
    }
    if (options.priority) {
        const priority = typeof options.priority === "string" ? options.priority.toLowerCase() : undefined;
        switch(priority){
            case "low":
                str += "; Priority=Low";
                break;
            case "medium":
                str += "; Priority=Medium";
                break;
            case "high":
                str += "; Priority=High";
                break;
            default:
                throw new TypeError("option priority is invalid: ".concat(options.priority));
        }
    }
    if (options.sameSite) {
        const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : options.sameSite;
        switch(sameSite){
            case true:
            case "strict":
                str += "; SameSite=Strict";
                break;
            case "lax":
                str += "; SameSite=Lax";
                break;
            case "none":
                str += "; SameSite=None";
                break;
            default:
                throw new TypeError("option sameSite is invalid: ".concat(options.sameSite));
        }
    }
    return str;
}
/**
 * URL-decode string value. Optimized to skip native call when no %.
 */ function decode(str) {
    if (str.indexOf("%") === -1) return str;
    try {
        return decodeURIComponent(str);
    } catch (e) {
        return str;
    }
}
/**
 * Determine if value is a Date.
 */ function isDate(val) {
    return __toString.call(val) === "[object Date]";
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/jwt.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 *
 *
 * This module contains functions and types
 * to encode and decode {@link https://authjs.dev/concepts/session-strategies#jwt-session JWT}s
 * issued and used by Auth.js.
 *
 * The JWT issued by Auth.js is _encrypted by default_, using the _A256CBC-HS512_ algorithm ({@link https://www.rfc-editor.org/rfc/rfc7518.html#section-5.2.5 JWE}).
 * It uses the `AUTH_SECRET` environment variable or the passed `secret` property to derive a suitable encryption key.
 *
 * :::info Note
 * Auth.js JWTs are meant to be used by the same app that issued them.
 * If you need JWT authentication for your third-party API, you should rely on your Identity Provider instead.
 * :::
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/core
 * ```
 *
 * You can then import this submodule from `@auth/core/jwt`.
 *
 * ## Usage
 *
 * :::warning Warning
 * This module *will* be refactored/changed. We do not recommend relying on it right now.
 * :::
 *
 *
 * ## Resources
 *
 * - [What is a JWT session strategy](https://authjs.dev/concepts/session-strategies#jwt-session)
 * - [RFC7519 - JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)
 *
 * @module jwt
 */ __turbopack_context__.s([
    "decode",
    ()=>decode,
    "encode",
    ()=>encode,
    "getToken",
    ()=>getToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$panva$2b$hkdf$40$1$2e$2$2e$1$2f$node_modules$2f40$panva$2f$hkdf$2f$dist$2f$web$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@panva+hkdf@1.2.1/node_modules/@panva/hkdf/dist/web/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$encrypt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/jose@6.1.0/node_modules/jose/dist/webapi/jwt/encrypt.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$util$2f$base64url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__base64url$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/jose@6.1.0/node_modules/jose/dist/webapi/util/base64url.js [app-client] (ecmascript) <export * as base64url>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwk$2f$thumbprint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/jose@6.1.0/node_modules/jose/dist/webapi/jwk/thumbprint.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$decrypt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/jose@6.1.0/node_modules/jose/dist/webapi/jwt/decrypt.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/cookie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$vendored$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/vendored/cookie.js [app-client] (ecmascript)");
;
;
;
;
;
const { parse: parseCookie } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$vendored$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__;
const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const now = ()=>Date.now() / 1000 | 0;
const alg = "dir";
const enc = "A256CBC-HS512";
async function encode(params) {
    const { token = {}, secret, maxAge = DEFAULT_MAX_AGE, salt } = params;
    const secrets = Array.isArray(secret) ? secret : [
        secret
    ];
    const encryptionSecret = await getDerivedEncryptionKey(enc, secrets[0], salt);
    const thumbprint = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwk$2f$thumbprint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateJwkThumbprint"])({
        kty: "oct",
        k: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$util$2f$base64url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__base64url$3e$__["base64url"].encode(encryptionSecret)
    }, "sha".concat(encryptionSecret.byteLength << 3));
    // @ts-expect-error `jose` allows any object as payload.
    return await new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$encrypt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EncryptJWT"](token).setProtectedHeader({
        alg,
        enc,
        kid: thumbprint
    }).setIssuedAt().setExpirationTime(now() + maxAge).setJti(crypto.randomUUID()).encrypt(encryptionSecret);
}
async function decode(params) {
    const { token, secret, salt } = params;
    const secrets = Array.isArray(secret) ? secret : [
        secret
    ];
    if (!token) return null;
    const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$decrypt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jwtDecrypt"])(token, async (param)=>{
        let { kid, enc } = param;
        for (const secret of secrets){
            const encryptionSecret = await getDerivedEncryptionKey(enc, secret, salt);
            if (kid === undefined) return encryptionSecret;
            const thumbprint = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwk$2f$thumbprint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateJwkThumbprint"])({
                kty: "oct",
                k: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$util$2f$base64url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__base64url$3e$__["base64url"].encode(encryptionSecret)
            }, "sha".concat(encryptionSecret.byteLength << 3));
            if (kid === thumbprint) return encryptionSecret;
        }
        throw new Error("no matching decryption secret");
    }, {
        clockTolerance: 15,
        keyManagementAlgorithms: [
            alg
        ],
        contentEncryptionAlgorithms: [
            enc,
            "A256GCM"
        ]
    });
    return payload;
}
async function getToken(params) {
    const { secureCookie, cookieName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultCookies"])(secureCookie !== null && secureCookie !== void 0 ? secureCookie : false).sessionToken.name, decode: _decode = decode, salt = cookieName, secret, logger = console, raw, req } = params;
    if (!req) throw new Error("Must pass `req` to JWT getToken()");
    const headers = req.headers instanceof Headers ? req.headers : new Headers(req.headers);
    var _headers_get;
    const sessionStore = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SessionStore"]({
        name: cookieName,
        options: {
            secure: secureCookie
        }
    }, parseCookie((_headers_get = headers.get("cookie")) !== null && _headers_get !== void 0 ? _headers_get : ""), logger);
    let token = sessionStore.value;
    const authorizationHeader = headers.get("authorization");
    if (!token && (authorizationHeader === null || authorizationHeader === void 0 ? void 0 : authorizationHeader.split(" ")[0]) === "Bearer") {
        const urlEncodedToken = authorizationHeader.split(" ")[1];
        token = decodeURIComponent(urlEncodedToken);
    }
    if (!token) return null;
    if (raw) return token;
    if (!secret) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingSecret"]("Must pass `secret` if not set to JWT getToken()");
    try {
        return await _decode({
            token,
            secret,
            salt
        });
    } catch (e) {
        return null;
    }
}
async function getDerivedEncryptionKey(enc, keyMaterial, salt) {
    let length;
    switch(enc){
        case "A256CBC-HS512":
            length = 64;
            break;
        case "A256GCM":
            length = 32;
            break;
        default:
            throw new Error("Unsupported JWT Content Encryption Algorithm");
    }
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$panva$2b$hkdf$40$1$2e$2$2e$1$2f$node_modules$2f40$panva$2f$hkdf$2f$dist$2f$web$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hkdf"])("sha256", keyMaterial, salt, "Auth.js Generated Encryption Key (".concat(salt, ")"), length);
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/callback-url.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Get callback URL based on query param / cookie + validation,
 * and add it to `req.options.callbackUrl`.
 */ __turbopack_context__.s([
    "createCallbackUrl",
    ()=>createCallbackUrl
]);
async function createCallbackUrl(param) {
    let { options, paramValue, cookieValue } = param;
    const { url, callbacks } = options;
    let callbackUrl = url.origin;
    if (paramValue) {
        // If callbackUrl form field or query parameter is passed try to use it if allowed
        callbackUrl = await callbacks.redirect({
            url: paramValue,
            baseUrl: url.origin
        });
    } else if (cookieValue) {
        // If no callbackUrl specified, try using the value from the cookie if allowed
        callbackUrl = await callbacks.redirect({
            url: cookieValue,
            baseUrl: url.origin
        });
    }
    return {
        callbackUrl,
        // Save callback URL in a cookie so that it can be used for subsequent requests in signin/signout/callback flow
        callbackUrlCookie: callbackUrl !== cookieValue ? callbackUrl : undefined
    };
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/logger.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setLogger",
    ()=>setLogger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
;
const red = "\x1b[31m";
const yellow = "\x1b[33m";
const grey = "\x1b[90m";
const reset = "\x1b[0m";
const defaultLogger = {
    error (error) {
        const name = error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"] ? error.type : error.name;
        console.error("".concat(red, "[auth][error]").concat(reset, " ").concat(name, ": ").concat(error.message));
        if (error.cause && typeof error.cause === "object" && "err" in error.cause && error.cause.err instanceof Error) {
            const { err, ...data } = error.cause;
            console.error("".concat(red, "[auth][cause]").concat(reset, ":"), err.stack);
            if (data) console.error("".concat(red, "[auth][details]").concat(reset, ":"), JSON.stringify(data, null, 2));
        } else if (error.stack) {
            console.error(error.stack.replace(/.*/, "").substring(1));
        }
    },
    warn (code) {
        const url = "https://warnings.authjs.dev";
        console.warn("".concat(yellow, "[auth][warn][").concat(code, "]").concat(reset), "Read more: ".concat(url));
    },
    debug (message, metadata) {
        console.log("".concat(grey, "[auth][debug]:").concat(reset, " ").concat(message), JSON.stringify(metadata, null, 2));
    }
};
function setLogger(config) {
    var _config_logger, _config_logger1, _config_logger2;
    const newLogger = {
        ...defaultLogger
    };
    // Turn off debug logging if `debug` isn't set to `true`
    if (!config.debug) newLogger.debug = ()=>{};
    if ((_config_logger = config.logger) === null || _config_logger === void 0 ? void 0 : _config_logger.error) newLogger.error = config.logger.error;
    if ((_config_logger1 = config.logger) === null || _config_logger1 === void 0 ? void 0 : _config_logger1.warn) newLogger.warn = config.logger.warn;
    if ((_config_logger2 = config.logger) === null || _config_logger2 === void 0 ? void 0 : _config_logger2.debug) newLogger.debug = config.logger.debug;
    var _config_logger3;
    (_config_logger3 = config.logger) !== null && _config_logger3 !== void 0 ? _config_logger3 : config.logger = newLogger;
    return newLogger;
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/actions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isAuthAction",
    ()=>isAuthAction
]);
const actions = [
    "providers",
    "session",
    "csrf",
    "signin",
    "signout",
    "callback",
    "verify-request",
    "error",
    "webauthn-options"
];
function isAuthAction(action) {
    return actions.includes(action);
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/web.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createHash",
    ()=>createHash,
    "parseActionAndProviderId",
    ()=>parseActionAndProviderId,
    "randomString",
    ()=>randomString,
    "toInternalRequest",
    ()=>toInternalRequest,
    "toRequest",
    ()=>toRequest,
    "toResponse",
    ()=>toResponse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$vendored$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/vendored/cookie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$actions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/actions.js [app-client] (ecmascript)");
;
;
;
;
const { parse: parseCookie, serialize: serializeCookie } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$vendored$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__;
async function getBody(req) {
    if (!("body" in req) || !req.body || req.method !== "POST") return;
    const contentType = req.headers.get("content-type");
    if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json")) {
        return await req.json();
    } else if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams(await req.text());
        return Object.fromEntries(params);
    }
}
async function toInternalRequest(req, config) {
    try {
        if (req.method !== "GET" && req.method !== "POST") throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Only GET and POST requests are supported");
        var // Defaults are usually set in the `init` function, but this is needed below
        _config_basePath;
        (_config_basePath = config.basePath) !== null && _config_basePath !== void 0 ? _config_basePath : config.basePath = "/auth";
        const url = new URL(req.url);
        const { action, providerId } = parseActionAndProviderId(url.pathname, config.basePath);
        var _req_headers_get, _parseCookie, _url_searchParams_get;
        return {
            url,
            action,
            providerId,
            method: req.method,
            headers: Object.fromEntries(req.headers),
            body: req.body ? await getBody(req) : undefined,
            cookies: (_parseCookie = parseCookie((_req_headers_get = req.headers.get("cookie")) !== null && _req_headers_get !== void 0 ? _req_headers_get : "")) !== null && _parseCookie !== void 0 ? _parseCookie : {},
            error: (_url_searchParams_get = url.searchParams.get("error")) !== null && _url_searchParams_get !== void 0 ? _url_searchParams_get : undefined,
            query: Object.fromEntries(url.searchParams)
        };
    } catch (e) {
        const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLogger"])(config);
        logger.error(e);
        logger.debug("request", req);
    }
}
function toRequest(request) {
    var _request_body;
    return new Request(request.url, {
        headers: request.headers,
        method: request.method,
        body: request.method === "POST" ? JSON.stringify((_request_body = request.body) !== null && _request_body !== void 0 ? _request_body : {}) : undefined
    });
}
function toResponse(res) {
    var _res_cookies;
    const headers = new Headers(res.headers);
    (_res_cookies = res.cookies) === null || _res_cookies === void 0 ? void 0 : _res_cookies.forEach((cookie)=>{
        const { name, value, options } = cookie;
        const cookieHeader = serializeCookie(name, value, options);
        if (headers.has("Set-Cookie")) headers.append("Set-Cookie", cookieHeader);
        else headers.set("Set-Cookie", cookieHeader);
    });
    let body = res.body;
    if (headers.get("content-type") === "application/json") body = JSON.stringify(res.body);
    else if (headers.get("content-type") === "application/x-www-form-urlencoded") body = new URLSearchParams(res.body).toString();
    var _res_status;
    const status = res.redirect ? 302 : (_res_status = res.status) !== null && _res_status !== void 0 ? _res_status : 200;
    const response = new Response(body, {
        headers,
        status
    });
    if (res.redirect) response.headers.set("Location", res.redirect);
    return response;
}
async function createHash(message) {
    const data = new TextEncoder().encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b)=>b.toString(16).padStart(2, "0")).join("").toString();
}
function randomString(size) {
    const i2hex = (i)=>("0" + i.toString(16)).slice(-2);
    const r = (a, i)=>a + i2hex(i);
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    return Array.from(bytes).reduce(r, "");
}
function parseActionAndProviderId(pathname, base) {
    const a = pathname.match(new RegExp("^".concat(base, "(.+)")));
    if (a === null) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Cannot parse action at ".concat(pathname));
    const actionAndProviderId = a.at(-1);
    const b = actionAndProviderId.replace(/^\//, "").split("/").filter(Boolean);
    if (b.length !== 1 && b.length !== 2) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Cannot parse action at ".concat(pathname));
    const [action, providerId] = b;
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$actions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAuthAction"])(action)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Cannot parse action at ".concat(pathname));
    if (providerId && ![
        "signin",
        "callback",
        "webauthn-options"
    ].includes(action)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Cannot parse action at ".concat(pathname));
    return {
        action,
        providerId: providerId == "undefined" ? undefined : providerId
    };
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/csrf-token.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCSRFToken",
    ()=>createCSRFToken,
    "validateCSRF",
    ()=>validateCSRF
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/web.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
;
;
async function createCSRFToken(param) {
    let { options, cookieValue, isPost, bodyValue } = param;
    if (cookieValue) {
        const [csrfToken, csrfTokenHash] = cookieValue.split("|");
        const expectedCsrfTokenHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHash"])("".concat(csrfToken).concat(options.secret));
        if (csrfTokenHash === expectedCsrfTokenHash) {
            // If hash matches then we trust the CSRF token value
            // If this is a POST request and the CSRF Token in the POST request matches
            // the cookie we have already verified is the one we have set, then the token is verified!
            const csrfTokenVerified = isPost && csrfToken === bodyValue;
            return {
                csrfTokenVerified,
                csrfToken
            };
        }
    }
    // New CSRF token
    const csrfToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["randomString"])(32);
    const csrfTokenHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHash"])("".concat(csrfToken).concat(options.secret));
    const cookie = "".concat(csrfToken, "|").concat(csrfTokenHash);
    return {
        cookie,
        csrfToken
    };
}
function validateCSRF(action, verified) {
    if (verified) return;
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingCSRF"]("CSRF token was missing during an action ".concat(action));
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/merge.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "merge",
    ()=>merge
]);
function isObject(item) {
    return item !== null && typeof item === "object";
}
function merge(target) {
    for(var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        sources[_key - 1] = arguments[_key];
    }
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for(const key in source){
            if (isObject(source[key])) {
                if (!isObject(target[key])) target[key] = Array.isArray(source[key]) ? [] : {};
                merge(target[key], source[key]);
            } else if (source[key] !== undefined) target[key] = source[key];
        }
    }
    return merge(target, ...sources);
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/symbols.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * :::danger
 * This option is intended for framework authors.
 * :::
 *
 * Auth.js comes with built-in CSRF protection, but
 * if you are implementing a framework that is already protected against CSRF attacks, you can skip this check by
 * passing this value to {@link AuthConfig.skipCSRFCheck}.
 */ __turbopack_context__.s([
    "conformInternal",
    ()=>conformInternal,
    "customFetch",
    ()=>customFetch,
    "raw",
    ()=>raw,
    "skipCSRFCheck",
    ()=>skipCSRFCheck
]);
const skipCSRFCheck = Symbol("skip-csrf-check");
const raw = Symbol("return-type-raw");
const customFetch = Symbol("custom-fetch");
const conformInternal = Symbol("conform-internal");
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/providers.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>parseProviders,
    "isOAuth2Provider",
    ()=>isOAuth2Provider,
    "isOAuthProvider",
    ()=>isOAuthProvider,
    "isOIDCProvider",
    ()=>isOIDCProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/merge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/symbols.js [app-client] (ecmascript)");
;
;
function parseProviders(params) {
    const { providerId, config } = params;
    var _config_basePath;
    const url = new URL((_config_basePath = config.basePath) !== null && _config_basePath !== void 0 ? _config_basePath : "/auth", params.url.origin);
    const providers = config.providers.map((p)=>{
        const provider = typeof p === "function" ? p() : p;
        const { options: userOptions, ...defaults } = provider;
        var _userOptions_id;
        const id = (_userOptions_id = userOptions === null || userOptions === void 0 ? void 0 : userOptions.id) !== null && _userOptions_id !== void 0 ? _userOptions_id : defaults.id;
        // TODO: Support if properties have different types, e.g. authorization: string or object
        const merged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["merge"])(defaults, userOptions, {
            signinUrl: "".concat(url, "/signin/").concat(id),
            callbackUrl: "".concat(url, "/callback/").concat(id)
        });
        if (provider.type === "oauth" || provider.type === "oidc") {
            var _normalized_authorization;
            var _userOptions_redirectProxyUrl, _merged_redirectProxyUrl;
            (_merged_redirectProxyUrl = merged.redirectProxyUrl) !== null && _merged_redirectProxyUrl !== void 0 ? _merged_redirectProxyUrl : merged.redirectProxyUrl = (_userOptions_redirectProxyUrl = userOptions === null || userOptions === void 0 ? void 0 : userOptions.redirectProxyUrl) !== null && _userOptions_redirectProxyUrl !== void 0 ? _userOptions_redirectProxyUrl : config.redirectProxyUrl;
            const normalized = normalizeOAuth(merged);
            // We currently don't support redirect proxies for response_mode=form_post
            if (((_normalized_authorization = normalized.authorization) === null || _normalized_authorization === void 0 ? void 0 : _normalized_authorization.url.searchParams.get("response_mode")) === "form_post") {
                delete normalized.redirectProxyUrl;
            }
            var // @ts-expect-error Symbols don't get merged by the `merge` function
            // so we need to do it manually.
            _normalized_customFetch;
            (_normalized_customFetch = normalized[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]) !== null && _normalized_customFetch !== void 0 ? _normalized_customFetch : normalized[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]] = userOptions === null || userOptions === void 0 ? void 0 : userOptions[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]];
            return normalized;
        }
        return merged;
    });
    const provider = providers.find((param)=>{
        let { id } = param;
        return id === providerId;
    });
    if (providerId && !provider) {
        const availableProviders = providers.map((p)=>p.id).join(", ");
        throw new Error('Provider with id "'.concat(providerId, '" not found. Available providers: [').concat(availableProviders, "]."));
    }
    return {
        providers,
        provider
    };
}
// TODO: Also add discovery here, if some endpoints/config are missing.
// We should return both a client and authorization server config.
function normalizeOAuth(c) {
    var _authorization_url;
    var _c_wellKnown;
    if (c.issuer) (_c_wellKnown = c.wellKnown) !== null && _c_wellKnown !== void 0 ? _c_wellKnown : c.wellKnown = "".concat(c.issuer, "/.well-known/openid-configuration");
    const authorization = normalizeEndpoint(c.authorization, c.issuer);
    if (authorization && !((_authorization_url = authorization.url) === null || _authorization_url === void 0 ? void 0 : _authorization_url.searchParams.has("scope"))) {
        authorization.url.searchParams.set("scope", "openid profile email");
    }
    const token = normalizeEndpoint(c.token, c.issuer);
    const userinfo = normalizeEndpoint(c.userinfo, c.issuer);
    var _c_checks;
    const checks = (_c_checks = c.checks) !== null && _c_checks !== void 0 ? _c_checks : [
        "pkce"
    ];
    if (c.redirectProxyUrl) {
        if (!checks.includes("state")) checks.push("state");
        c.redirectProxyUrl = "".concat(c.redirectProxyUrl, "/callback/").concat(c.id);
    }
    var _c_profile, _c_account;
    return {
        ...c,
        authorization,
        token,
        checks,
        userinfo,
        profile: (_c_profile = c.profile) !== null && _c_profile !== void 0 ? _c_profile : defaultProfile,
        account: (_c_account = c.account) !== null && _c_account !== void 0 ? _c_account : defaultAccount
    };
}
/**
 * Returns basic user profile from the userinfo response/`id_token` claims.
 * The returned `id` will become the `account.providerAccountId`. `user.id`
 * and `account.id` are auto-generated UUID's.
 *
 * The result if this function is used to create the `User` in the database.
 * @see https://authjs.dev/reference/core/adapters#user
 * @see https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * @see https://openid.net/specs/openid-connect-core-1_0.html#
 */ const defaultProfile = (profile)=>{
    var _profile_sub, _ref, _profile_name, _ref1;
    return stripUndefined({
        id: (_ref = (_profile_sub = profile.sub) !== null && _profile_sub !== void 0 ? _profile_sub : profile.id) !== null && _ref !== void 0 ? _ref : crypto.randomUUID(),
        name: (_ref1 = (_profile_name = profile.name) !== null && _profile_name !== void 0 ? _profile_name : profile.nickname) !== null && _ref1 !== void 0 ? _ref1 : profile.preferred_username,
        email: profile.email,
        image: profile.picture
    });
};
/**
 * Returns basic OAuth/OIDC values from the token response.
 * @see https://www.ietf.org/rfc/rfc6749.html#section-5.1
 * @see https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse
 * @see https://authjs.dev/reference/core/adapters#account
 */ const defaultAccount = (account)=>{
    return stripUndefined({
        access_token: account.access_token,
        id_token: account.id_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
        token_type: account.token_type,
        session_state: account.session_state
    });
};
function stripUndefined(o) {
    const result = {};
    for (const [k, v] of Object.entries(o)){
        if (v !== undefined) result[k] = v;
    }
    return result;
}
function normalizeEndpoint(e, issuer) {
    if (!e && issuer) return;
    if (typeof e === "string") {
        return {
            url: new URL(e)
        };
    }
    var _e_url;
    // If e.url is undefined, it's because the provider config
    // assumes that we will use the issuer endpoint.
    // The existence of either e.url or provider.issuer is checked in
    // assert.ts. We fallback to "https://authjs.dev" to be able to pass around
    // a valid URL even if the user only provided params.
    // NOTE: This need to be checked when constructing the URL
    // for the authorization, token and userinfo endpoints.
    const url = new URL((_e_url = e === null || e === void 0 ? void 0 : e.url) !== null && _e_url !== void 0 ? _e_url : "https://authjs.dev");
    if ((e === null || e === void 0 ? void 0 : e.params) != null) {
        for (let [key, value] of Object.entries(e.params)){
            if (key === "claims") {
                value = JSON.stringify(value);
            }
            url.searchParams.set(key, String(value));
        }
    }
    return {
        url,
        request: e === null || e === void 0 ? void 0 : e.request,
        conform: e === null || e === void 0 ? void 0 : e.conform,
        ...(e === null || e === void 0 ? void 0 : e.clientPrivateKey) ? {
            clientPrivateKey: e === null || e === void 0 ? void 0 : e.clientPrivateKey
        } : null
    };
}
function isOIDCProvider(provider) {
    return provider.type === "oidc";
}
function isOAuth2Provider(provider) {
    return provider.type === "oauth";
}
function isOAuthProvider(provider) {
    return provider.type === "oauth" || provider.type === "oidc";
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/init.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultCallbacks",
    ()=>defaultCallbacks,
    "init",
    ()=>init
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/jwt.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$callback$2d$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/callback-url.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/cookie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/csrf-token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$providers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/providers.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/merge.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
const defaultCallbacks = {
    signIn () {
        return true;
    },
    redirect (param) {
        let { url, baseUrl } = param;
        if (url.startsWith("/")) return "".concat(baseUrl).concat(url);
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
    },
    session (param) {
        let { session } = param;
        var _session_user, _session_user1, _session_user2, _session_expires_toISOString, _session_expires;
        var _session_expires_toISOString1;
        return {
            user: {
                name: (_session_user = session.user) === null || _session_user === void 0 ? void 0 : _session_user.name,
                email: (_session_user1 = session.user) === null || _session_user1 === void 0 ? void 0 : _session_user1.email,
                image: (_session_user2 = session.user) === null || _session_user2 === void 0 ? void 0 : _session_user2.image
            },
            expires: (_session_expires_toISOString1 = (_session_expires = session.expires) === null || _session_expires === void 0 ? void 0 : (_session_expires_toISOString = _session_expires.toISOString) === null || _session_expires_toISOString === void 0 ? void 0 : _session_expires_toISOString.call(_session_expires)) !== null && _session_expires_toISOString1 !== void 0 ? _session_expires_toISOString1 : session.expires
        };
    },
    jwt (param) {
        let { token } = param;
        return token;
    }
};
async function init(param) {
    let { authOptions: config, providerId, action, url, cookies: reqCookies, callbackUrl: reqCallbackUrl, csrfToken: reqCsrfToken, csrfDisabled, isPost } = param;
    var _config_session;
    const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLogger"])(config);
    const { providers, provider } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$providers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
        url,
        providerId,
        config
    });
    const maxAge = 30 * 24 * 60 * 60; // Sessions expire after 30 days of being idle by default
    let isOnRedirectProxy = false;
    if (((provider === null || provider === void 0 ? void 0 : provider.type) === "oauth" || (provider === null || provider === void 0 ? void 0 : provider.type) === "oidc") && provider.redirectProxyUrl) {
        try {
            isOnRedirectProxy = new URL(provider.redirectProxyUrl).origin === url.origin;
        } catch (e) {
            throw new TypeError("redirectProxyUrl must be a valid URL. Received: ".concat(provider.redirectProxyUrl));
        }
    }
    var _config_useSecureCookies, _config_session_maxAge, _config_events;
    // User provided options are overridden by other options,
    // except for the options with special handling above
    const options = {
        debug: false,
        pages: {},
        theme: {
            colorScheme: "auto",
            logo: "",
            brandColor: "",
            buttonText: ""
        },
        // Custom options override defaults
        ...config,
        // These computed settings can have values in userOptions but we override them
        // and are request-specific.
        url,
        action,
        // @ts-expect-errors
        provider,
        cookies: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$merge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["merge"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["defaultCookies"]((_config_useSecureCookies = config.useSecureCookies) !== null && _config_useSecureCookies !== void 0 ? _config_useSecureCookies : url.protocol === "https:"), config.cookies),
        providers,
        // Session options
        session: {
            // If no adapter specified, force use of JSON Web Tokens (stateless)
            strategy: config.adapter ? "database" : "jwt",
            maxAge,
            updateAge: 24 * 60 * 60,
            generateSessionToken: ()=>crypto.randomUUID(),
            ...config.session
        },
        // JWT options
        jwt: {
            secret: config.secret,
            maxAge: (_config_session_maxAge = (_config_session = config.session) === null || _config_session === void 0 ? void 0 : _config_session.maxAge) !== null && _config_session_maxAge !== void 0 ? _config_session_maxAge : maxAge,
            encode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encode"],
            decode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decode"],
            ...config.jwt
        },
        // Event messages
        events: eventsErrorHandler((_config_events = config.events) !== null && _config_events !== void 0 ? _config_events : {}, logger),
        adapter: adapterErrorHandler(config.adapter, logger),
        // Callback functions
        callbacks: {
            ...defaultCallbacks,
            ...config.callbacks
        },
        logger,
        callbackUrl: url.origin,
        isOnRedirectProxy,
        experimental: {
            ...config.experimental
        }
    };
    // Init cookies
    const cookies = [];
    if (csrfDisabled) {
        options.csrfTokenVerified = true;
    } else {
        const { csrfToken, cookie: csrfCookie, csrfTokenVerified } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCSRFToken"])({
            options,
            cookieValue: reqCookies === null || reqCookies === void 0 ? void 0 : reqCookies[options.cookies.csrfToken.name],
            isPost,
            bodyValue: reqCsrfToken
        });
        options.csrfToken = csrfToken;
        options.csrfTokenVerified = csrfTokenVerified;
        if (csrfCookie) {
            cookies.push({
                name: options.cookies.csrfToken.name,
                value: csrfCookie,
                options: options.cookies.csrfToken.options
            });
        }
    }
    const { callbackUrl, callbackUrlCookie } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$callback$2d$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createCallbackUrl"])({
        options,
        cookieValue: reqCookies === null || reqCookies === void 0 ? void 0 : reqCookies[options.cookies.callbackUrl.name],
        paramValue: reqCallbackUrl
    });
    options.callbackUrl = callbackUrl;
    if (callbackUrlCookie) {
        cookies.push({
            name: options.cookies.callbackUrl.name,
            value: callbackUrlCookie,
            options: options.cookies.callbackUrl.options
        });
    }
    return {
        options,
        cookies
    };
}
/** Wraps an object of methods and adds error handling. */ function eventsErrorHandler(methods, logger) {
    return Object.keys(methods).reduce((acc, name)=>{
        acc[name] = async function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            try {
                const method = methods[name];
                return await method(...args);
            } catch (e) {
                logger.error(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EventError"](e));
            }
        };
        return acc;
    }, {});
}
/** Handles adapter induced errors. */ function adapterErrorHandler(adapter, logger) {
    if (!adapter) return;
    return Object.keys(adapter).reduce((acc, name)=>{
        acc[name] = async function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            try {
                logger.debug("adapter_".concat(name), {
                    args
                });
                const method = adapter[name];
                return await method(...args);
            } catch (e) {
                const error = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdapterError"](e);
                logger.error(error);
                throw error;
            }
        };
        return acc;
    }, {});
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/error.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ErrorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/preact@10.24.3/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js [app-client] (ecmascript) <locals>");
;
function ErrorPage(props) {
    const { url, error = "default", theme } = props;
    const signinPageUrl = "".concat(url, "/signin");
    const errors = {
        default: {
            status: 200,
            heading: "Error",
            message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("a", {
                    className: "site",
                    href: url === null || url === void 0 ? void 0 : url.origin,
                    children: url === null || url === void 0 ? void 0 : url.host
                })
            })
        },
        Configuration: {
            status: 500,
            heading: "Server error",
            message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                children: [
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "There is a problem with the server configuration."
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "Check the server logs for more information."
                    })
                ]
            })
        },
        AccessDenied: {
            status: 403,
            heading: "Access Denied",
            message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                children: [
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "You do not have permission to sign in."
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("a", {
                            className: "button",
                            href: signinPageUrl,
                            children: "Sign in"
                        })
                    })
                ]
            })
        },
        Verification: {
            status: 403,
            heading: "Unable to sign in",
            message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                children: [
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "The sign in link is no longer valid."
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "It may have been used already or it may have expired."
                    })
                ]
            }),
            signin: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("a", {
                className: "button",
                href: signinPageUrl,
                children: "Sign in"
            })
        }
    };
    var _errors_error;
    const { status, heading, message, signin } = (_errors_error = errors[error]) !== null && _errors_error !== void 0 ? _errors_error : errors.default;
    return {
        status,
        html: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
            className: "error",
            children: [
                (theme === null || theme === void 0 ? void 0 : theme.brandColor) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("style", {
                    dangerouslySetInnerHTML: {
                        __html: "\n        :root {\n          --brand-color: ".concat(theme === null || theme === void 0 ? void 0 : theme.brandColor, "\n        }\n      ")
                    }
                }),
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                    className: "card",
                    children: [
                        (theme === null || theme === void 0 ? void 0 : theme.logo) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("img", {
                            src: theme === null || theme === void 0 ? void 0 : theme.logo,
                            alt: "Logo",
                            className: "logo"
                        }),
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("h1", {
                            children: heading
                        }),
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("div", {
                            className: "message",
                            children: message
                        }),
                        signin
                    ]
                })
            ]
        })
    };
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/webauthn-client.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//@ts-check
// Declare a SimpleWebAuthnBrowser variable as part of "window"
/** @typedef {"authenticate"} WebAuthnAuthenticate */ /** @typedef {"register"} WebAuthnRegister */ /** @typedef {WebAuthnRegister | WebAuthnAuthenticate} WebAuthnOptionsAction */ /**
 * @template {WebAuthnOptionsAction} T
 * @typedef {T extends WebAuthnAuthenticate ?
 *  { options: import("@simplewebauthn/types").PublicKeyCredentialRequestOptionsJSON; action: "authenticate" } :
 *  T extends WebAuthnRegister ?
 *  { options: import("@simplewebauthn/types").PublicKeyCredentialCreationOptionsJSON; action: "register" } :
 * never
 * } WebAuthnOptionsReturn
 */ /**
 * webauthnScript is the client-side script that handles the webauthn form
 *
 * @param {string} authURL is the URL of the auth API
 * @param {string} providerID is the ID of the webauthn provider
 */ __turbopack_context__.s([
    "webauthnScript",
    ()=>webauthnScript
]);
async function webauthnScript(authURL, providerID) {
    /** @type {typeof import("@simplewebauthn/browser")} */ // @ts-ignore
    const WebAuthnBrowser = window.SimpleWebAuthnBrowser;
    /**
     * Fetch webauthn options from the server
     *
     * @template {WebAuthnOptionsAction} T
     * @param {T | undefined} action action to fetch options for
     * @returns {Promise<WebAuthnOptionsReturn<T> | undefined>}
     */ async function fetchOptions(action) {
        // Create the options URL with the action and query parameters
        const url = new URL("".concat(authURL, "/webauthn-options/").concat(providerID));
        if (action) url.searchParams.append("action", action);
        const formFields = getFormFields();
        formFields.forEach((field)=>{
            url.searchParams.append(field.name, field.value);
        });
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Failed to fetch options", res);
            return;
        }
        return res.json();
    }
    /**
     * Get the webauthn form from the page
     *
     * @returns {HTMLFormElement}
     */ function getForm() {
        const formID = "#".concat(providerID, "-form");
        /** @type {HTMLFormElement | null} */ const form = document.querySelector(formID);
        if (!form) throw new Error("Form '".concat(formID, "' not found"));
        return form;
    }
    /**
     * Get formFields from the form
     *
     * @returns {HTMLInputElement[]}
     */ function getFormFields() {
        const form = getForm();
        /** @type {HTMLInputElement[]} */ const formFields = Array.from(form.querySelectorAll("input[data-form-field]"));
        return formFields;
    }
    /**
     * Passkey form submission handler.
     * Takes the input from the form and a few other parameters and submits it to the server.
     *
     * @param {WebAuthnOptionsAction} action action to submit
     * @param {unknown | undefined} data optional data to submit
     * @returns {Promise<void>}
     */ async function submitForm(action, data) {
        const form = getForm();
        // If a POST request, create hidden fields in the form
        // and submit it so the browser redirects on login
        if (action) {
            const actionInput = document.createElement("input");
            actionInput.type = "hidden";
            actionInput.name = "action";
            actionInput.value = action;
            form.appendChild(actionInput);
        }
        if (data) {
            const dataInput = document.createElement("input");
            dataInput.type = "hidden";
            dataInput.name = "data";
            dataInput.value = JSON.stringify(data);
            form.appendChild(dataInput);
        }
        return form.submit();
    }
    /**
     * Executes the authentication flow by fetching options from the server,
     * starting the authentication, and submitting the response to the server.
     *
     * @param {WebAuthnOptionsReturn<WebAuthnAuthenticate>['options']} options
     * @param {boolean} autofill Whether or not to use the browser's autofill
     * @returns {Promise<void>}
     */ async function authenticationFlow(options, autofill) {
        // Start authentication
        const authResp = await WebAuthnBrowser.startAuthentication(options, autofill);
        // Submit authentication response to server
        return await submitForm("authenticate", authResp);
    }
    /**
     * @param {WebAuthnOptionsReturn<WebAuthnRegister>['options']} options
     */ async function registrationFlow(options) {
        // Check if all required formFields are set
        const formFields = getFormFields();
        formFields.forEach((field)=>{
            if (field.required && !field.value) {
                throw new Error("Missing required field: ".concat(field.name));
            }
        });
        // Start registration
        const regResp = await WebAuthnBrowser.startRegistration(options);
        // Submit registration response to server
        return await submitForm("register", regResp);
    }
    /**
     * Attempts to authenticate the user when the page loads
     * using the browser's autofill popup.
     *
     * @returns {Promise<void>}
     */ async function autofillAuthentication() {
        // if the browser can't handle autofill, don't try
        if (!WebAuthnBrowser.browserSupportsWebAuthnAutofill()) return;
        const res = await fetchOptions("authenticate");
        if (!res) {
            console.error("Failed to fetch option for autofill authentication");
            return;
        }
        try {
            await authenticationFlow(res.options, true);
        } catch (e) {
            console.error(e);
        }
    }
    /**
     * Sets up the passkey form by overriding the form submission handler
     * so that it attempts to authenticate the user when the form is submitted.
     * If the user is not registered, it will attempt to register them instead.
     */ async function setupForm() {
        const form = getForm();
        // If the browser can't do WebAuthn, hide the form
        if (!WebAuthnBrowser.browserSupportsWebAuthn()) {
            form.style.display = "none";
            return;
        }
        if (form) {
            form.addEventListener("submit", async (e)=>{
                e.preventDefault();
                // Fetch options from the server without assuming that
                // the user is registered
                const res = await fetchOptions(undefined);
                if (!res) {
                    console.error("Failed to fetch options for form submission");
                    return;
                }
                // Then execute the appropriate flow
                if (res.action === "authenticate") {
                    try {
                        await authenticationFlow(res.options, false);
                    } catch (e) {
                        console.error(e);
                    }
                } else if (res.action === "register") {
                    try {
                        await registrationFlow(res.options);
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        }
    }
    // On page load, setup the form and attempt to authenticate the user.
    setupForm();
    autofillAuthentication();
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/signin.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SigninPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/preact@10.24.3/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$dist$2f$preact$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/preact@10.24.3/node_modules/preact/dist/preact.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/webauthn-client.js [app-client] (ecmascript)");
;
;
const signinErrors = {
    default: "Unable to sign in.",
    Signin: "Try signing in with a different account.",
    OAuthSignin: "Try signing in with a different account.",
    OAuthCallbackError: "Try signing in with a different account.",
    OAuthCreateAccount: "Try signing in with a different account.",
    EmailCreateAccount: "Try signing in with a different account.",
    Callback: "Try signing in with a different account.",
    OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
    EmailSignin: "The e-mail could not be sent.",
    CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
    SessionRequired: "Please sign in to access this page."
};
function ConditionalUIScript(providerID) {
    const startConditionalUIScript = "\nconst currentURL = window.location.href;\nconst authURL = currentURL.substring(0, currentURL.lastIndexOf('/'));\n(".concat(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webauthnScript"], ')(authURL, "').concat(providerID, '");\n');
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$dist$2f$preact$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("script", {
            dangerouslySetInnerHTML: {
                __html: startConditionalUIScript
            }
        })
    });
}
function SigninPage(props) {
    var _providers_find;
    const { csrfToken, providers = [], callbackUrl, theme, email, error: errorType } = props;
    if (typeof document !== "undefined" && (theme === null || theme === void 0 ? void 0 : theme.brandColor)) {
        document.documentElement.style.setProperty("--brand-color", theme.brandColor);
    }
    if (typeof document !== "undefined" && (theme === null || theme === void 0 ? void 0 : theme.buttonText)) {
        document.documentElement.style.setProperty("--button-text-color", theme.buttonText);
    }
    var _signinErrors_errorType;
    const error = errorType && ((_signinErrors_errorType = signinErrors[errorType]) !== null && _signinErrors_errorType !== void 0 ? _signinErrors_errorType : signinErrors.default);
    const providerLogoPath = "https://authjs.dev/img/providers";
    const conditionalUIProviderID = (_providers_find = providers.find((provider)=>provider.type === "webauthn" && provider.enableConditionalUI)) === null || _providers_find === void 0 ? void 0 : _providers_find.id;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
        className: "signin",
        children: [
            (theme === null || theme === void 0 ? void 0 : theme.brandColor) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("style", {
                dangerouslySetInnerHTML: {
                    __html: ":root {--brand-color: ".concat(theme.brandColor, "}")
                }
            }),
            (theme === null || theme === void 0 ? void 0 : theme.buttonText) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("style", {
                dangerouslySetInnerHTML: {
                    __html: "\n        :root {\n          --button-text-color: ".concat(theme.buttonText, "\n        }\n      ")
                }
            }),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                className: "card",
                children: [
                    error && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("div", {
                        className: "error",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                            children: error
                        })
                    }),
                    (theme === null || theme === void 0 ? void 0 : theme.logo) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("img", {
                        src: theme.logo,
                        alt: "Logo",
                        className: "logo"
                    }),
                    providers.map((provider, i)=>{
                        let bg, brandColor, logo;
                        if (provider.type === "oauth" || provider.type === "oidc") {
                            ;
                            var _provider_style;
                            ({ bg = "#fff", brandColor, logo = "".concat(providerLogoPath, "/").concat(provider.id, ".svg") } = (_provider_style = provider.style) !== null && _provider_style !== void 0 ? _provider_style : {});
                        }
                        var _ref;
                        const color = (_ref = brandColor !== null && brandColor !== void 0 ? brandColor : bg) !== null && _ref !== void 0 ? _ref : "#fff";
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                            className: "provider",
                            children: [
                                provider.type === "oauth" || provider.type === "oidc" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("form", {
                                    action: provider.signinUrl,
                                    method: "POST",
                                    children: [
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                            type: "hidden",
                                            name: "csrfToken",
                                            value: csrfToken
                                        }),
                                        callbackUrl && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                            type: "hidden",
                                            name: "callbackUrl",
                                            value: callbackUrl
                                        }),
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("button", {
                                            type: "submit",
                                            className: "button",
                                            style: {
                                                "--provider-brand-color": color
                                            },
                                            tabIndex: 0,
                                            children: [
                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("span", {
                                                    style: {
                                                        filter: "invert(1) grayscale(1) brightness(1.3) contrast(9000)",
                                                        "mix-blend-mode": "luminosity",
                                                        opacity: 0.95
                                                    },
                                                    children: [
                                                        "Sign in with ",
                                                        provider.name
                                                    ]
                                                }),
                                                logo && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("img", {
                                                    loading: "lazy",
                                                    height: 24,
                                                    src: logo
                                                })
                                            ]
                                        })
                                    ]
                                }) : null,
                                (provider.type === "email" || provider.type === "credentials" || provider.type === "webauthn") && i > 0 && providers[i - 1].type !== "email" && providers[i - 1].type !== "credentials" && providers[i - 1].type !== "webauthn" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("hr", {}),
                                provider.type === "email" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("form", {
                                    action: provider.signinUrl,
                                    method: "POST",
                                    children: [
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                            type: "hidden",
                                            name: "csrfToken",
                                            value: csrfToken
                                        }),
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("label", {
                                            className: "section-header",
                                            htmlFor: "input-email-for-".concat(provider.id, "-provider"),
                                            children: "Email"
                                        }),
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                            id: "input-email-for-".concat(provider.id, "-provider"),
                                            autoFocus: true,
                                            type: "email",
                                            name: "email",
                                            value: email,
                                            placeholder: "email@example.com",
                                            required: true
                                        }),
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("button", {
                                            id: "submitButton",
                                            type: "submit",
                                            tabIndex: 0,
                                            children: [
                                                "Sign in with ",
                                                provider.name
                                            ]
                                        })
                                    ]
                                }),
                                provider.type === "credentials" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("form", {
                                    action: provider.callbackUrl,
                                    method: "POST",
                                    children: [
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                            type: "hidden",
                                            name: "csrfToken",
                                            value: csrfToken
                                        }),
                                        Object.keys(provider.credentials).map((credential)=>{
                                            var _provider_credentials_credential_label, _provider_credentials_credential_type, _provider_credentials_credential_placeholder;
                                            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                                                children: [
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("label", {
                                                        className: "section-header",
                                                        htmlFor: "input-".concat(credential, "-for-").concat(provider.id, "-provider"),
                                                        children: (_provider_credentials_credential_label = provider.credentials[credential].label) !== null && _provider_credentials_credential_label !== void 0 ? _provider_credentials_credential_label : credential
                                                    }),
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                                        name: credential,
                                                        id: "input-".concat(credential, "-for-").concat(provider.id, "-provider"),
                                                        type: (_provider_credentials_credential_type = provider.credentials[credential].type) !== null && _provider_credentials_credential_type !== void 0 ? _provider_credentials_credential_type : "text",
                                                        placeholder: (_provider_credentials_credential_placeholder = provider.credentials[credential].placeholder) !== null && _provider_credentials_credential_placeholder !== void 0 ? _provider_credentials_credential_placeholder : "",
                                                        ...provider.credentials[credential]
                                                    })
                                                ]
                                            }, "input-group-".concat(provider.id));
                                        }),
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("button", {
                                            id: "submitButton",
                                            type: "submit",
                                            tabIndex: 0,
                                            children: [
                                                "Sign in with ",
                                                provider.name
                                            ]
                                        })
                                    ]
                                }),
                                provider.type === "webauthn" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("form", {
                                    action: provider.callbackUrl,
                                    method: "POST",
                                    id: "".concat(provider.id, "-form"),
                                    children: [
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                            type: "hidden",
                                            name: "csrfToken",
                                            value: csrfToken
                                        }),
                                        Object.keys(provider.formFields).map((field)=>{
                                            var _provider_formFields_field_label, _provider_formFields_field_type, _provider_formFields_field_placeholder;
                                            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                                                children: [
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("label", {
                                                        className: "section-header",
                                                        htmlFor: "input-".concat(field, "-for-").concat(provider.id, "-provider"),
                                                        children: (_provider_formFields_field_label = provider.formFields[field].label) !== null && _provider_formFields_field_label !== void 0 ? _provider_formFields_field_label : field
                                                    }),
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                                        name: field,
                                                        "data-form-field": true,
                                                        id: "input-".concat(field, "-for-").concat(provider.id, "-provider"),
                                                        type: (_provider_formFields_field_type = provider.formFields[field].type) !== null && _provider_formFields_field_type !== void 0 ? _provider_formFields_field_type : "text",
                                                        placeholder: (_provider_formFields_field_placeholder = provider.formFields[field].placeholder) !== null && _provider_formFields_field_placeholder !== void 0 ? _provider_formFields_field_placeholder : "",
                                                        ...provider.formFields[field]
                                                    })
                                                ]
                                            }, "input-group-".concat(provider.id));
                                        }),
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("button", {
                                            id: "submitButton-".concat(provider.id),
                                            type: "submit",
                                            tabIndex: 0,
                                            children: [
                                                "Sign in with ",
                                                provider.name
                                            ]
                                        })
                                    ]
                                }),
                                (provider.type === "email" || provider.type === "credentials" || provider.type === "webauthn") && i + 1 < providers.length && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("hr", {})
                            ]
                        }, provider.id);
                    })
                ]
            }),
            conditionalUIProviderID && ConditionalUIScript(conditionalUIProviderID)
        ]
    });
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/signout.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SignoutPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/preact@10.24.3/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js [app-client] (ecmascript) <locals>");
;
function SignoutPage(props) {
    const { url, csrfToken, theme } = props;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
        className: "signout",
        children: [
            (theme === null || theme === void 0 ? void 0 : theme.brandColor) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("style", {
                dangerouslySetInnerHTML: {
                    __html: "\n        :root {\n          --brand-color: ".concat(theme.brandColor, "\n        }\n      ")
                }
            }),
            (theme === null || theme === void 0 ? void 0 : theme.buttonText) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("style", {
                dangerouslySetInnerHTML: {
                    __html: "\n        :root {\n          --button-text-color: ".concat(theme.buttonText, "\n        }\n      ")
                }
            }),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                className: "card",
                children: [
                    (theme === null || theme === void 0 ? void 0 : theme.logo) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("img", {
                        src: theme.logo,
                        alt: "Logo",
                        className: "logo"
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("h1", {
                        children: "Signout"
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "Are you sure you want to sign out?"
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("form", {
                        action: url === null || url === void 0 ? void 0 : url.toString(),
                        method: "POST",
                        children: [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("input", {
                                type: "hidden",
                                name: "csrfToken",
                                value: csrfToken
                            }),
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("button", {
                                id: "submitButton",
                                type: "submit",
                                children: "Sign out"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/styles.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Generated by `pnpm css`
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
const __TURBOPACK__default__export__ = ':root {\n  --border-width: 1px;\n  --border-radius: 0.5rem;\n  --color-error: #c94b4b;\n  --color-info: #157efb;\n  --color-info-hover: #0f6ddb;\n  --color-info-text: #fff;\n}\n\n.__next-auth-theme-auto,\n.__next-auth-theme-light {\n  --color-background: #ececec;\n  --color-background-hover: rgba(236, 236, 236, 0.8);\n  --color-background-card: #fff;\n  --color-text: #000;\n  --color-primary: #444;\n  --color-control-border: #bbb;\n  --color-button-active-background: #f9f9f9;\n  --color-button-active-border: #aaa;\n  --color-separator: #ccc;\n  --provider-bg: #fff;\n  --provider-bg-hover: color-mix(\n    in srgb,\n    var(--provider-brand-color) 30%,\n    #fff\n  );\n}\n\n.__next-auth-theme-dark {\n  --color-background: #161b22;\n  --color-background-hover: rgba(22, 27, 34, 0.8);\n  --color-background-card: #0d1117;\n  --color-text: #fff;\n  --color-primary: #ccc;\n  --color-control-border: #555;\n  --color-button-active-background: #060606;\n  --color-button-active-border: #666;\n  --color-separator: #444;\n  --provider-bg: #161b22;\n  --provider-bg-hover: color-mix(\n    in srgb,\n    var(--provider-brand-color) 30%,\n    #000\n  );\n}\n\n.__next-auth-theme-dark img[src$="42-school.svg"],\n  .__next-auth-theme-dark img[src$="apple.svg"],\n  .__next-auth-theme-dark img[src$="boxyhq-saml.svg"],\n  .__next-auth-theme-dark img[src$="eveonline.svg"],\n  .__next-auth-theme-dark img[src$="github.svg"],\n  .__next-auth-theme-dark img[src$="mailchimp.svg"],\n  .__next-auth-theme-dark img[src$="medium.svg"],\n  .__next-auth-theme-dark img[src$="okta.svg"],\n  .__next-auth-theme-dark img[src$="patreon.svg"],\n  .__next-auth-theme-dark img[src$="ping-id.svg"],\n  .__next-auth-theme-dark img[src$="roblox.svg"],\n  .__next-auth-theme-dark img[src$="threads.svg"],\n  .__next-auth-theme-dark img[src$="wikimedia.svg"] {\n    filter: invert(1);\n  }\n\n.__next-auth-theme-dark #submitButton {\n    background-color: var(--provider-bg, var(--color-info));\n  }\n\n@media (prefers-color-scheme: dark) {\n  .__next-auth-theme-auto {\n    --color-background: #161b22;\n    --color-background-hover: rgba(22, 27, 34, 0.8);\n    --color-background-card: #0d1117;\n    --color-text: #fff;\n    --color-primary: #ccc;\n    --color-control-border: #555;\n    --color-button-active-background: #060606;\n    --color-button-active-border: #666;\n    --color-separator: #444;\n    --provider-bg: #161b22;\n    --provider-bg-hover: color-mix(\n      in srgb,\n      var(--provider-brand-color) 30%,\n      #000\n    );\n  }\n    .__next-auth-theme-auto img[src$="42-school.svg"],\n    .__next-auth-theme-auto img[src$="apple.svg"],\n    .__next-auth-theme-auto img[src$="boxyhq-saml.svg"],\n    .__next-auth-theme-auto img[src$="eveonline.svg"],\n    .__next-auth-theme-auto img[src$="github.svg"],\n    .__next-auth-theme-auto img[src$="mailchimp.svg"],\n    .__next-auth-theme-auto img[src$="medium.svg"],\n    .__next-auth-theme-auto img[src$="okta.svg"],\n    .__next-auth-theme-auto img[src$="patreon.svg"],\n    .__next-auth-theme-auto img[src$="ping-id.svg"],\n    .__next-auth-theme-auto img[src$="roblox.svg"],\n    .__next-auth-theme-auto img[src$="threads.svg"],\n    .__next-auth-theme-auto img[src$="wikimedia.svg"] {\n      filter: invert(1);\n    }\n    .__next-auth-theme-auto #submitButton {\n      background-color: var(--provider-bg, var(--color-info));\n    }\n}\n\nhtml {\n  box-sizing: border-box;\n}\n\n*,\n*:before,\n*:after {\n  box-sizing: inherit;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  background-color: var(--color-background);\n  margin: 0;\n  padding: 0;\n  font-family:\n    ui-sans-serif,\n    system-ui,\n    -apple-system,\n    BlinkMacSystemFont,\n    "Segoe UI",\n    Roboto,\n    "Helvetica Neue",\n    Arial,\n    "Noto Sans",\n    sans-serif,\n    "Apple Color Emoji",\n    "Segoe UI Emoji",\n    "Segoe UI Symbol",\n    "Noto Color Emoji";\n}\n\nh1 {\n  margin-bottom: 1.5rem;\n  padding: 0 1rem;\n  font-weight: 400;\n  color: var(--color-text);\n}\n\np {\n  margin-bottom: 1.5rem;\n  padding: 0 1rem;\n  color: var(--color-text);\n}\n\nform {\n  margin: 0;\n  padding: 0;\n}\n\nlabel {\n  font-weight: 500;\n  text-align: left;\n  margin-bottom: 0.25rem;\n  display: block;\n  color: var(--color-text);\n}\n\ninput[type] {\n  box-sizing: border-box;\n  display: block;\n  width: 100%;\n  padding: 0.5rem 1rem;\n  border: var(--border-width) solid var(--color-control-border);\n  background: var(--color-background-card);\n  font-size: 1rem;\n  border-radius: var(--border-radius);\n  color: var(--color-text);\n}\n\np {\n  font-size: 1.1rem;\n  line-height: 2rem;\n}\n\na.button {\n  text-decoration: none;\n  line-height: 1rem;\n}\n\na.button:link,\n  a.button:visited {\n    background-color: var(--color-background);\n    color: var(--color-primary);\n  }\n\nbutton,\na.button {\n  padding: 0.75rem 1rem;\n  color: var(--provider-color, var(--color-primary));\n  background-color: var(--provider-bg, var(--color-background));\n  border: 1px solid #00000031;\n  font-size: 0.9rem;\n  height: 50px;\n  border-radius: var(--border-radius);\n  transition: background-color 250ms ease-in-out;\n  font-weight: 300;\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n:is(button,a.button):hover {\n    background-color: var(--provider-bg-hover, var(--color-background-hover));\n    cursor: pointer;\n  }\n\n:is(button,a.button):active {\n    cursor: pointer;\n  }\n\n:is(button,a.button) span {\n    color: var(--provider-bg);\n  }\n\n#submitButton {\n  color: var(--button-text-color, var(--color-info-text));\n  background-color: var(--brand-color, var(--color-info));\n  width: 100%;\n}\n\n#submitButton:hover {\n    background-color: var(\n      --button-hover-bg,\n      var(--color-info-hover)\n    ) !important;\n  }\n\na.site {\n  color: var(--color-primary);\n  text-decoration: none;\n  font-size: 1rem;\n  line-height: 2rem;\n}\n\na.site:hover {\n    text-decoration: underline;\n  }\n\n.page {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  display: grid;\n  place-items: center;\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\n.page > div {\n    text-align: center;\n  }\n\n.error a.button {\n    padding-left: 2rem;\n    padding-right: 2rem;\n    margin-top: 0.5rem;\n  }\n\n.error .message {\n    margin-bottom: 1.5rem;\n  }\n\n.signin input[type="text"] {\n    margin-left: auto;\n    margin-right: auto;\n    display: block;\n  }\n\n.signin hr {\n    display: block;\n    border: 0;\n    border-top: 1px solid var(--color-separator);\n    margin: 2rem auto 1rem auto;\n    overflow: visible;\n  }\n\n.signin hr::before {\n      content: "or";\n      background: var(--color-background-card);\n      color: #888;\n      padding: 0 0.4rem;\n      position: relative;\n      top: -0.7rem;\n    }\n\n.signin .error {\n    background: #f5f5f5;\n    font-weight: 500;\n    border-radius: 0.3rem;\n    background: var(--color-error);\n  }\n\n.signin .error p {\n      text-align: left;\n      padding: 0.5rem 1rem;\n      font-size: 0.9rem;\n      line-height: 1.2rem;\n      color: var(--color-info-text);\n    }\n\n.signin > div,\n  .signin form {\n    display: block;\n  }\n\n.signin > div input[type], .signin form input[type] {\n      margin-bottom: 0.5rem;\n    }\n\n.signin > div button, .signin form button {\n      width: 100%;\n    }\n\n.signin .provider + .provider {\n    margin-top: 1rem;\n  }\n\n.logo {\n  display: inline-block;\n  max-width: 150px;\n  margin: 1.25rem 0;\n  max-height: 70px;\n}\n\n.card {\n  background-color: var(--color-background-card);\n  border-radius: 1rem;\n  padding: 1.25rem 2rem;\n}\n\n.card .header {\n    color: var(--color-primary);\n  }\n\n.card input[type]::-moz-placeholder {\n    color: color-mix(\n      in srgb,\n      var(--color-text) 20%,\n      var(--color-button-active-background)\n    );\n  }\n\n.card input[type]::placeholder {\n    color: color-mix(\n      in srgb,\n      var(--color-text) 20%,\n      var(--color-button-active-background)\n    );\n  }\n\n.card input[type] {\n    background: color-mix(in srgb, var(--color-background-card) 95%, black);\n  }\n\n.section-header {\n  color: var(--color-text);\n}\n\n@media screen and (min-width: 450px) {\n  .card {\n    margin: 2rem 0;\n    width: 368px;\n  }\n}\n\n@media screen and (max-width: 450px) {\n  .card {\n    margin: 1rem 0;\n    width: 343px;\n  }\n}\n';
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/verify-request.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VerifyRequestPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/preact@10.24.3/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js [app-client] (ecmascript) <locals>");
;
function VerifyRequestPage(props) {
    const { url, theme } = props;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
        className: "verify-request",
        children: [
            theme.brandColor && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("style", {
                dangerouslySetInnerHTML: {
                    __html: "\n        :root {\n          --brand-color: ".concat(theme.brandColor, "\n        }\n      ")
                }
            }),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsxs"])("div", {
                className: "card",
                children: [
                    theme.logo && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("img", {
                        src: theme.logo,
                        alt: "Logo",
                        className: "logo"
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("h1", {
                        children: "Check your email"
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: "A sign in link has been sent to your email address."
                    }),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("p", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2f$jsx$2d$runtime$2f$dist$2f$jsxRuntime$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["jsx"])("a", {
                            className: "site",
                            href: url.origin,
                            children: url.host
                        })
                    })
                ]
            })
        ]
    });
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>renderPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$2d$render$2d$to$2d$string$40$6$2e$5$2e$11_preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2d$render$2d$to$2d$string$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/preact-render-to-string@6.5.11_preact@10.24.3/node_modules/preact-render-to-string/dist/index.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/error.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$signin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/signin.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$signout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/signout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$styles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/styles.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$verify$2d$request$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/verify-request.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
function send(param) {
    let { html, title, status, cookies, theme, headTags } = param;
    var _theme_colorScheme;
    return {
        cookies,
        status,
        headers: {
            "Content-Type": "text/html"
        },
        body: '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>'.concat(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$styles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], "</style><title>").concat(title, "</title>").concat(headTags !== null && headTags !== void 0 ? headTags : "", '</head><body class="__next-auth-theme-').concat((_theme_colorScheme = theme === null || theme === void 0 ? void 0 : theme.colorScheme) !== null && _theme_colorScheme !== void 0 ? _theme_colorScheme : "auto", '"><div class="page">').concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$preact$2d$render$2d$to$2d$string$40$6$2e$5$2e$11_preact$40$10$2e$24$2e$3$2f$node_modules$2f$preact$2d$render$2d$to$2d$string$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["renderToString"])(html), "</div></body></html>")
    };
}
function renderPage(params) {
    const { url, theme, query, cookies, pages, providers } = params;
    return {
        csrf (skip, options, cookies) {
            if (!skip) {
                return {
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "private, no-cache, no-store",
                        Expires: "0",
                        Pragma: "no-cache"
                    },
                    body: {
                        csrfToken: options.csrfToken
                    },
                    cookies
                };
            }
            options.logger.warn("csrf-disabled");
            cookies.push({
                name: options.cookies.csrfToken.name,
                value: "",
                options: {
                    ...options.cookies.csrfToken.options,
                    maxAge: 0
                }
            });
            return {
                status: 404,
                cookies
            };
        },
        providers (providers) {
            return {
                headers: {
                    "Content-Type": "application/json"
                },
                body: providers.reduce((acc, param)=>{
                    let { id, name, type, signinUrl, callbackUrl } = param;
                    acc[id] = {
                        id,
                        name,
                        type,
                        signinUrl,
                        callbackUrl
                    };
                    return acc;
                }, {})
            };
        },
        signin (providerId, error) {
            var _params_providers;
            if (providerId) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Unsupported action");
            if (pages === null || pages === void 0 ? void 0 : pages.signIn) {
                var _params_callbackUrl;
                let signinUrl = "".concat(pages.signIn).concat(pages.signIn.includes("?") ? "&" : "?").concat(new URLSearchParams({
                    callbackUrl: (_params_callbackUrl = params.callbackUrl) !== null && _params_callbackUrl !== void 0 ? _params_callbackUrl : "/"
                }));
                if (error) signinUrl = "".concat(signinUrl, "&").concat(new URLSearchParams({
                    error
                }));
                return {
                    redirect: signinUrl,
                    cookies
                };
            }
            // If we have a webauthn provider with conditional UI and
            // a simpleWebAuthnBrowserScript is defined, we need to
            // render the script in the page.
            const webauthnProvider = providers === null || providers === void 0 ? void 0 : providers.find((p)=>p.type === "webauthn" && p.enableConditionalUI && !!p.simpleWebAuthnBrowserVersion);
            let simpleWebAuthnBrowserScript = "";
            if (webauthnProvider) {
                const { simpleWebAuthnBrowserVersion } = webauthnProvider;
                simpleWebAuthnBrowserScript = '<script src="https://unpkg.com/@simplewebauthn/browser@'.concat(simpleWebAuthnBrowserVersion, '/dist/bundle/index.umd.min.js" crossorigin="anonymous"></script>');
            }
            return send({
                cookies,
                theme,
                html: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$signin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
                    csrfToken: params.csrfToken,
                    // We only want to render providers
                    providers: (_params_providers = params.providers) === null || _params_providers === void 0 ? void 0 : _params_providers.filter((provider)=>// Always render oauth and email type providers
                        [
                            "email",
                            "oauth",
                            "oidc"
                        ].includes(provider.type) || provider.type === "credentials" && provider.credentials || provider.type === "webauthn" && provider.formFields || // Don't render other provider types
                        false),
                    callbackUrl: params.callbackUrl,
                    theme: params.theme,
                    error,
                    ...query
                }),
                title: "Sign In",
                headTags: simpleWebAuthnBrowserScript
            });
        },
        signout () {
            if (pages === null || pages === void 0 ? void 0 : pages.signOut) return {
                redirect: pages.signOut,
                cookies
            };
            return send({
                cookies,
                theme,
                html: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$signout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
                    csrfToken: params.csrfToken,
                    url,
                    theme
                }),
                title: "Sign Out"
            });
        },
        verifyRequest (props) {
            var _url_search;
            if (pages === null || pages === void 0 ? void 0 : pages.verifyRequest) return {
                redirect: "".concat(pages.verifyRequest).concat((_url_search = url === null || url === void 0 ? void 0 : url.search) !== null && _url_search !== void 0 ? _url_search : ""),
                cookies
            };
            return send({
                cookies,
                theme,
                html: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$verify$2d$request$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
                    url,
                    theme,
                    ...props
                }),
                title: "Verify Request"
            });
        },
        error (error) {
            if (pages === null || pages === void 0 ? void 0 : pages.error) {
                return {
                    redirect: "".concat(pages.error).concat(pages.error.includes("?") ? "&" : "?", "error=").concat(error),
                    cookies
                };
            }
            return send({
                cookies,
                theme,
                // @ts-expect-error fix error type
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
                    url,
                    theme,
                    error
                }),
                title: "Error"
            });
        }
    };
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/date.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Takes a number in seconds and returns the date in the future.
 * Optionally takes a second date parameter. In that case
 * the date in the future will be calculated from that date instead of now.
 */ __turbopack_context__.s([
    "fromDate",
    ()=>fromDate
]);
function fromDate(time) {
    let date = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : Date.now();
    return new Date(date + time * 1000);
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/handle-login.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "handleLoginOrRegister",
    ()=>handleLoginOrRegister
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/date.js [app-client] (ecmascript)");
;
;
async function handleLoginOrRegister(sessionToken, _profile, _account, options) {
    // Input validation
    if (!(_account === null || _account === void 0 ? void 0 : _account.providerAccountId) || !_account.type) throw new Error("Missing or invalid provider account");
    if (![
        "email",
        "oauth",
        "oidc",
        "webauthn"
    ].includes(_account.type)) throw new Error("Provider not supported");
    const { adapter, jwt, events, session: { strategy: sessionStrategy, generateSessionToken } } = options;
    // If no adapter is configured then we don't have a database and cannot
    // persist data; in this mode we just return a dummy session object.
    if (!adapter) {
        return {
            user: _profile,
            account: _account
        };
    }
    const profile = _profile;
    let account = _account;
    const { createUser, updateUser, getUser, getUserByAccount, getUserByEmail, linkAccount, createSession, getSessionAndUser, deleteSession } = adapter;
    let session = null;
    let user = null;
    let isNewUser = false;
    const useJwtSession = sessionStrategy === "jwt";
    if (sessionToken) {
        if (useJwtSession) {
            try {
                const salt = options.cookies.sessionToken.name;
                session = await jwt.decode({
                    ...jwt,
                    token: sessionToken,
                    salt
                });
                if (session && "sub" in session && session.sub) {
                    user = await getUser(session.sub);
                }
            } catch (e) {
            // If session can't be verified, treat as no session
            }
        } else {
            const userAndSession = await getSessionAndUser(sessionToken);
            if (userAndSession) {
                session = userAndSession.session;
                user = userAndSession.user;
            }
        }
    }
    if (account.type === "email") {
        // If signing in with an email, check if an account with the same email address exists already
        const userByEmail = await getUserByEmail(profile.email);
        if (userByEmail) {
            var _events_updateUser;
            // If they are not already signed in as the same user, this flow will
            // sign them out of the current session and sign them in as the new user
            if ((user === null || user === void 0 ? void 0 : user.id) !== userByEmail.id && !useJwtSession && sessionToken) {
                // Delete existing session if they are currently signed in as another user.
                // This will switch user accounts for the session in cases where the user was
                // already logged in with a different account.
                await deleteSession(sessionToken);
            }
            // Update emailVerified property on the user object
            user = await updateUser({
                id: userByEmail.id,
                emailVerified: new Date()
            });
            await ((_events_updateUser = events.updateUser) === null || _events_updateUser === void 0 ? void 0 : _events_updateUser.call(events, {
                user
            }));
        } else {
            var _events_createUser;
            // Create user account if there isn't one for the email address already
            user = await createUser({
                ...profile,
                emailVerified: new Date()
            });
            await ((_events_createUser = events.createUser) === null || _events_createUser === void 0 ? void 0 : _events_createUser.call(events, {
                user
            }));
            isNewUser = true;
        }
        // Create new session
        session = useJwtSession ? {} : await createSession({
            sessionToken: generateSessionToken(),
            userId: user.id,
            expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(options.session.maxAge)
        });
        return {
            session,
            user,
            isNewUser
        };
    } else if (account.type === "webauthn") {
        // Check if the account exists
        const userByAccount = await getUserByAccount({
            providerAccountId: account.providerAccountId,
            provider: account.provider
        });
        if (userByAccount) {
            if (user) {
                // If the user is already signed in with this account, we don't need to do anything
                if (userByAccount.id === user.id) {
                    const currentAccount = {
                        ...account,
                        userId: user.id
                    };
                    return {
                        session,
                        user,
                        isNewUser,
                        account: currentAccount
                    };
                }
                // If the user is currently signed in, but the new account they are signing in
                // with is already associated with another user, then we cannot link them
                // and need to return an error.
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountNotLinked"]("The account is already associated with another user", {
                    provider: account.provider
                });
            }
            // If there is no active session, but the account being signed in with is already
            // associated with a valid user then create session to sign the user in.
            session = useJwtSession ? {} : await createSession({
                sessionToken: generateSessionToken(),
                userId: userByAccount.id,
                expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(options.session.maxAge)
            });
            const currentAccount = {
                ...account,
                userId: userByAccount.id
            };
            return {
                session,
                user: userByAccount,
                isNewUser,
                account: currentAccount
            };
        } else {
            var _events_createUser1, _events_linkAccount;
            // If the account doesn't exist, we'll create it
            if (user) {
                var _events_linkAccount1;
                // If the user is already signed in and the account isn't already associated
                // with another user account then we can go ahead and link the accounts safely.
                await linkAccount({
                    ...account,
                    userId: user.id
                });
                await ((_events_linkAccount1 = events.linkAccount) === null || _events_linkAccount1 === void 0 ? void 0 : _events_linkAccount1.call(events, {
                    user,
                    account,
                    profile
                }));
                // As they are already signed in, we don't need to do anything after linking them
                const currentAccount = {
                    ...account,
                    userId: user.id
                };
                return {
                    session,
                    user,
                    isNewUser,
                    account: currentAccount
                };
            }
            // If the user is not signed in and it looks like a new account then we
            // check there also isn't an user account already associated with the same
            // email address as the one in the request.
            const userByEmail = profile.email ? await getUserByEmail(profile.email) : null;
            if (userByEmail) {
                // We don't trust user-provided email addresses, so we don't want to link accounts
                // if the email address associated with the new account is already associated with
                // an existing account.
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccountNotLinked"]("Another account already exists with the same e-mail address", {
                    provider: account.provider
                });
            } else {
                // If the current user is not logged in and the profile isn't linked to any user
                // accounts (by email or provider account id)...
                //
                // If no account matching the same [provider].id or .email exists, we can
                // create a new account for the user, link it to the OAuth account and
                // create a new session for them so they are signed in with it.
                user = await createUser({
                    ...profile
                });
            }
            await ((_events_createUser1 = events.createUser) === null || _events_createUser1 === void 0 ? void 0 : _events_createUser1.call(events, {
                user
            }));
            await linkAccount({
                ...account,
                userId: user.id
            });
            await ((_events_linkAccount = events.linkAccount) === null || _events_linkAccount === void 0 ? void 0 : _events_linkAccount.call(events, {
                user,
                account,
                profile
            }));
            session = useJwtSession ? {} : await createSession({
                sessionToken: generateSessionToken(),
                userId: user.id,
                expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(options.session.maxAge)
            });
            const currentAccount = {
                ...account,
                userId: user.id
            };
            return {
                session,
                user,
                isNewUser: true,
                account: currentAccount
            };
        }
    }
    // If signing in with OAuth account, check to see if the account exists already
    const userByAccount = await getUserByAccount({
        providerAccountId: account.providerAccountId,
        provider: account.provider
    });
    if (userByAccount) {
        if (user) {
            // If the user is already signed in with this account, we don't need to do anything
            if (userByAccount.id === user.id) {
                return {
                    session,
                    user,
                    isNewUser
                };
            }
            // If the user is currently signed in, but the new account they are signing in
            // with is already associated with another user, then we cannot link them
            // and need to return an error.
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthAccountNotLinked"]("The account is already associated with another user", {
                provider: account.provider
            });
        }
        // If there is no active session, but the account being signed in with is already
        // associated with a valid user then create session to sign the user in.
        session = useJwtSession ? {} : await createSession({
            sessionToken: generateSessionToken(),
            userId: userByAccount.id,
            expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(options.session.maxAge)
        });
        return {
            session,
            user: userByAccount,
            isNewUser
        };
    } else {
        var _events_createUser2, _events_linkAccount2;
        const { provider: p } = options;
        const { type, provider, providerAccountId, userId, ...tokenSet } = account;
        const defaults = {
            providerAccountId,
            provider,
            type,
            userId
        };
        var _p_account;
        account = Object.assign((_p_account = p.account(tokenSet)) !== null && _p_account !== void 0 ? _p_account : {}, defaults);
        if (user) {
            var _events_linkAccount3;
            // If the user is already signed in and the OAuth account isn't already associated
            // with another user account then we can go ahead and link the accounts safely.
            await linkAccount({
                ...account,
                userId: user.id
            });
            await ((_events_linkAccount3 = events.linkAccount) === null || _events_linkAccount3 === void 0 ? void 0 : _events_linkAccount3.call(events, {
                user,
                account,
                profile
            }));
            // As they are already signed in, we don't need to do anything after linking them
            return {
                session,
                user,
                isNewUser
            };
        }
        // If the user is not signed in and it looks like a new OAuth account then we
        // check there also isn't an user account already associated with the same
        // email address as the one in the OAuth profile.
        //
        // This step is often overlooked in OAuth implementations, but covers the following cases:
        //
        // 1. It makes it harder for someone to accidentally create two accounts.
        //    e.g. by signin in with email, then again with an oauth account connected to the same email.
        // 2. It makes it harder to hijack a user account using a 3rd party OAuth account.
        //    e.g. by creating an oauth account then changing the email address associated with it.
        //
        // It's quite common for services to automatically link accounts in this case, but it's
        // better practice to require the user to sign in *then* link accounts to be sure
        // someone is not exploiting a problem with a third party OAuth service.
        //
        // OAuth providers should require email address verification to prevent this, but in
        // practice that is not always the case; this helps protect against that.
        const userByEmail = profile.email ? await getUserByEmail(profile.email) : null;
        if (userByEmail) {
            const provider = options.provider;
            if (provider === null || provider === void 0 ? void 0 : provider.allowDangerousEmailAccountLinking) {
                // If you trust the oauth provider to correctly verify email addresses, you can opt-in to
                // account linking even when the user is not signed-in.
                user = userByEmail;
                isNewUser = false;
            } else {
                // We end up here when we don't have an account with the same [provider].id *BUT*
                // we do already have an account with the same email address as the one in the
                // OAuth profile the user has just tried to sign in with.
                //
                // We don't want to have two accounts with the same email address, and we don't
                // want to link them in case it's not safe to do so, so instead we prompt the user
                // to sign in via email to verify their identity and then link the accounts.
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthAccountNotLinked"]("Another account already exists with the same e-mail address", {
                    provider: account.provider
                });
            }
        } else {
            // If the current user is not logged in and the profile isn't linked to any user
            // accounts (by email or provider account id)...
            //
            // If no account matching the same [provider].id or .email exists, we can
            // create a new account for the user, link it to the OAuth account and
            // create a new session for them so they are signed in with it.
            user = await createUser({
                ...profile,
                emailVerified: null
            });
            isNewUser = true;
        }
        await ((_events_createUser2 = events.createUser) === null || _events_createUser2 === void 0 ? void 0 : _events_createUser2.call(events, {
            user
        }));
        await linkAccount({
            ...account,
            userId: user.id
        });
        await ((_events_linkAccount2 = events.linkAccount) === null || _events_linkAccount2 === void 0 ? void 0 : _events_linkAccount2.call(events, {
            user,
            account,
            profile
        }));
        session = useJwtSession ? {} : await createSession({
            sessionToken: generateSessionToken(),
            userId: user.id,
            expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(options.session.maxAge)
        });
        return {
            session,
            user,
            isNewUser
        };
    }
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/checks.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "nonce",
    ()=>nonce,
    "pkce",
    ()=>pkce,
    "state",
    ()=>state,
    "webauthnChallenge",
    ()=>webauthnChallenge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/oauth4webapi@3.8.1/node_modules/oauth4webapi/build/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
// NOTE: We use the default JWT methods here because they encrypt/decrypt the payload, not just sign it.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/jwt.js [app-client] (ecmascript)");
;
;
;
const COOKIE_TTL = 60 * 15; // 15 minutes
/** Returns a cookie with a JWT encrypted payload. */ async function sealCookie(name, payload, options) {
    const { cookies, logger } = options;
    const cookie = cookies[name];
    const expires = new Date();
    expires.setTime(expires.getTime() + COOKIE_TTL * 1000);
    logger.debug("CREATE_".concat(name.toUpperCase()), {
        name: cookie.name,
        payload,
        COOKIE_TTL,
        expires
    });
    const encoded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encode"])({
        ...options.jwt,
        maxAge: COOKIE_TTL,
        token: {
            value: payload
        },
        salt: cookie.name
    });
    const cookieOptions = {
        ...cookie.options,
        expires
    };
    return {
        name: cookie.name,
        value: encoded,
        options: cookieOptions
    };
}
async function parseCookie(name, value, options) {
    try {
        const { logger, cookies, jwt } = options;
        logger.debug("PARSE_".concat(name.toUpperCase()), {
            cookie: value
        });
        if (!value) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCheck"]("".concat(name, " cookie was missing"));
        const parsed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decode"])({
            ...jwt,
            token: value,
            salt: cookies[name].name
        });
        if (parsed === null || parsed === void 0 ? void 0 : parsed.value) return parsed.value;
        throw new Error("Invalid cookie");
    } catch (error) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCheck"]("".concat(name, " value could not be parsed"), {
            cause: error
        });
    }
}
function clearCookie(name, options, resCookies) {
    const { logger, cookies } = options;
    const cookie = cookies[name];
    logger.debug("CLEAR_".concat(name.toUpperCase()), {
        cookie
    });
    resCookies.push({
        name: cookie.name,
        value: "",
        options: {
            ...cookies[name].options,
            maxAge: 0
        }
    });
}
function useCookie(check, name) {
    return async function(cookies, resCookies, options) {
        var _provider_checks;
        const { provider, logger } = options;
        if (!(provider === null || provider === void 0 ? void 0 : (_provider_checks = provider.checks) === null || _provider_checks === void 0 ? void 0 : _provider_checks.includes(check))) return;
        const cookieValue = cookies === null || cookies === void 0 ? void 0 : cookies[options.cookies[name].name];
        logger.debug("USE_".concat(name.toUpperCase()), {
            value: cookieValue
        });
        const parsed = await parseCookie(name, cookieValue, options);
        clearCookie(name, options, resCookies);
        return parsed;
    };
}
const pkce = {
    /** Creates a PKCE code challenge and verifier pair. The verifier in stored in the cookie. */ async create (options) {
        const code_verifier = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomCodeVerifier"]();
        const value = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculatePKCECodeChallenge"](code_verifier);
        const cookie = await sealCookie("pkceCodeVerifier", code_verifier, options);
        return {
            cookie,
            value
        };
    },
    /**
     * Returns code_verifier if the provider is configured to use PKCE,
     * and clears the container cookie afterwards.
     * An error is thrown if the code_verifier is missing or invalid.
     */ use: useCookie("pkce", "pkceCodeVerifier")
};
const STATE_MAX_AGE = 60 * 15; // 15 minutes in seconds
const encodedStateSalt = "encodedState";
const state = {
    /** Creates a state cookie with an optionally encoded body. */ async create (options, origin) {
        const { provider } = options;
        if (!provider.checks.includes("state")) {
            if (origin) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCheck"]("State data was provided but the provider is not configured to use state");
            }
            return;
        }
        // IDEA: Allow the user to pass data to be stored in the state
        const payload = {
            origin,
            random: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomState"]()
        };
        const value = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encode"])({
            secret: options.jwt.secret,
            token: payload,
            salt: encodedStateSalt,
            maxAge: STATE_MAX_AGE
        });
        const cookie = await sealCookie("state", value, options);
        return {
            cookie,
            value
        };
    },
    /**
     * Returns state if the provider is configured to use state,
     * and clears the container cookie afterwards.
     * An error is thrown if the state is missing or invalid.
     */ use: useCookie("state", "state"),
    /** Decodes the state. If it could not be decoded, it throws an error. */ async decode (state, options) {
        try {
            options.logger.debug("DECODE_STATE", {
                state
            });
            const payload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decode"])({
                secret: options.jwt.secret,
                token: state,
                salt: encodedStateSalt
            });
            if (payload) return payload;
            throw new Error("Invalid state");
        } catch (error) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCheck"]("State could not be decoded", {
                cause: error
            });
        }
    }
};
const nonce = {
    async create (options) {
        if (!options.provider.checks.includes("nonce")) return;
        const value = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomNonce"]();
        const cookie = await sealCookie("nonce", value, options);
        return {
            cookie,
            value
        };
    },
    /**
     * Returns nonce if the provider is configured to use nonce,
     * and clears the container cookie afterwards.
     * An error is thrown if the nonce is missing or invalid.
     * @see https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
     * @see https://danielfett.de/2020/05/16/pkce-vs-nonce-equivalent-or-not/#nonce
     */ use: useCookie("nonce", "nonce")
};
const WEBAUTHN_CHALLENGE_MAX_AGE = 60 * 15; // 15 minutes in seconds
const webauthnChallengeSalt = "encodedWebauthnChallenge";
const webauthnChallenge = {
    async create (options, challenge, registerData) {
        return {
            cookie: await sealCookie("webauthnChallenge", await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encode"])({
                secret: options.jwt.secret,
                token: {
                    challenge,
                    registerData
                },
                salt: webauthnChallengeSalt,
                maxAge: WEBAUTHN_CHALLENGE_MAX_AGE
            }), options)
        };
    },
    /** Returns WebAuthn challenge if present. */ async use (options, cookies, resCookies) {
        const cookieValue = cookies === null || cookies === void 0 ? void 0 : cookies[options.cookies.webauthnChallenge.name];
        const parsed = await parseCookie("webauthnChallenge", cookieValue, options);
        const payload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decode"])({
            secret: options.jwt.secret,
            token: parsed,
            salt: webauthnChallengeSalt
        });
        // Clear the WebAuthn challenge cookie after use
        clearCookie("webauthnChallenge", options, resCookies);
        if (!payload) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidCheck"]("WebAuthn challenge was missing");
        return payload;
    }
};
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/callback.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUserAndAccount",
    ()=>getUserAndAccount,
    "handleOAuth",
    ()=>handleOAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/checks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/oauth4webapi@3.8.1/node_modules/oauth4webapi/build/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$providers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/providers.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/symbols.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$util$2f$decode_jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/jose@6.1.0/node_modules/jose/dist/webapi/util/decode_jwt.js [app-client] (ecmascript)");
;
;
;
;
;
;
function formUrlEncode(token) {
    return encodeURIComponent(token).replace(/%20/g, "+");
}
/**
 * Formats client_id and client_secret as an HTTP Basic Authentication header as per the OAuth 2.0
 * specified in RFC6749.
 */ function clientSecretBasic(clientId, clientSecret) {
    const username = formUrlEncode(clientId);
    const password = formUrlEncode(clientSecret);
    const credentials = btoa("".concat(username, ":").concat(password));
    return "Basic ".concat(credentials);
}
async function handleOAuth(params, cookies, options) {
    var _provider_token;
    const { logger, provider } = options;
    let as;
    const { token, userinfo } = provider;
    // Falls back to authjs.dev if the user only passed params
    if ((!(token === null || token === void 0 ? void 0 : token.url) || token.url.host === "authjs.dev") && (!(userinfo === null || userinfo === void 0 ? void 0 : userinfo.url) || userinfo.url.host === "authjs.dev")) {
        // We assume that issuer is always defined as this has been asserted earlier
        const issuer = new URL(provider.issuer);
        const discoveryResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["discoveryRequest"](issuer, {
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowInsecureRequests"]]: true,
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]: provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]
        });
        as = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processDiscoveryResponse"](issuer, discoveryResponse);
        if (!as.token_endpoint) throw new TypeError("TODO: Authorization server did not provide a token endpoint.");
        if (!as.userinfo_endpoint) throw new TypeError("TODO: Authorization server did not provide a userinfo endpoint.");
    } else {
        var _provider_issuer;
        as = {
            issuer: (_provider_issuer = provider.issuer) !== null && _provider_issuer !== void 0 ? _provider_issuer : "https://authjs.dev",
            token_endpoint: token === null || token === void 0 ? void 0 : token.url.toString(),
            userinfo_endpoint: userinfo === null || userinfo === void 0 ? void 0 : userinfo.url.toString()
        };
    }
    const client = {
        client_id: provider.clientId,
        ...provider.client
    };
    let clientAuth;
    switch(client.token_endpoint_auth_method){
        // TODO: in the next breaking major version have undefined be `client_secret_post`
        case undefined:
        case "client_secret_basic":
            // TODO: in the next breaking major version use o.ClientSecretBasic() here
            clientAuth = (_as, _client, _body, headers)=>{
                headers.set("authorization", clientSecretBasic(provider.clientId, provider.clientSecret));
            };
            break;
        case "client_secret_post":
            clientAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClientSecretPost"](provider.clientSecret);
            break;
        case "client_secret_jwt":
            clientAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClientSecretJwt"](provider.clientSecret);
            break;
        case "private_key_jwt":
            clientAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PrivateKeyJwt"](provider.token.clientPrivateKey, {
                // TODO: review in the next breaking change
                [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["modifyAssertion"]] (_header, payload) {
                    payload.aud = [
                        as.issuer,
                        as.token_endpoint
                    ];
                }
            });
            break;
        case "none":
            clientAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["None"]();
            break;
        default:
            throw new Error("unsupported client authentication method");
    }
    const resCookies = [];
    const state = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["state"].use(cookies, resCookies, options);
    let codeGrantParams;
    try {
        codeGrantParams = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateAuthResponse"](as, client, new URLSearchParams(params), provider.checks.includes("state") ? state : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["skipStateCheck"]);
    } catch (err) {
        if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthorizationResponseError"]) {
            const cause = {
                providerId: provider.id,
                ...Object.fromEntries(err.cause.entries())
            };
            logger.debug("OAuthCallbackError", cause);
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthCallbackError"]("OAuth Provider returned an error", cause);
        }
        throw err;
    }
    const codeVerifier = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pkce"].use(cookies, resCookies, options);
    let redirect_uri = provider.callbackUrl;
    if (!options.isOnRedirectProxy && provider.redirectProxyUrl) {
        redirect_uri = provider.redirectProxyUrl;
    }
    let codeGrantResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authorizationCodeGrantRequest"](as, client, clientAuth, codeGrantParams, redirect_uri, codeVerifier !== null && codeVerifier !== void 0 ? codeVerifier : "decoy", {
        // TODO: move away from allowing insecure HTTP requests
        [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowInsecureRequests"]]: true,
        [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]: function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            if (!provider.checks.includes("pkce")) {
                args[1].body.delete("code_verifier");
            }
            var _provider_customFetch;
            return ((_provider_customFetch = provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]) !== null && _provider_customFetch !== void 0 ? _provider_customFetch : fetch)(...args);
        }
    });
    if ((_provider_token = provider.token) === null || _provider_token === void 0 ? void 0 : _provider_token.conform) {
        var _ref;
        codeGrantResponse = (_ref = await provider.token.conform(codeGrantResponse.clone())) !== null && _ref !== void 0 ? _ref : codeGrantResponse;
    }
    let profile = {};
    const requireIdToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$providers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOIDCProvider"])(provider);
    if (provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["conformInternal"]]) {
        switch(provider.id){
            case "microsoft-entra-id":
            case "azure-ad":
                {
                    /**
                 * These providers return errors in the response body and
                 * need the authorization server metadata to be re-processed
                 * based on the `id_token`'s `tid` claim.
                 * @see: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow#error-response-1
                 */ const responseJson = await codeGrantResponse.clone().json();
                    if (responseJson.error) {
                        const cause = {
                            providerId: provider.id,
                            ...responseJson
                        };
                        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthCallbackError"]("OAuth Provider returned an error: ".concat(responseJson.error), cause);
                    }
                    const { tid } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jose$40$6$2e$1$2e$0$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$util$2f$decode_jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decodeJwt"])(responseJson.id_token);
                    if (typeof tid === "string") {
                        var _as_issuer_match, _as_issuer;
                        const tenantRe = /microsoftonline\.com\/(\w+)\/v2\.0/;
                        var _as_issuer_match_;
                        const tenantId = (_as_issuer_match_ = (_as_issuer = as.issuer) === null || _as_issuer === void 0 ? void 0 : (_as_issuer_match = _as_issuer.match(tenantRe)) === null || _as_issuer_match === void 0 ? void 0 : _as_issuer_match[1]) !== null && _as_issuer_match_ !== void 0 ? _as_issuer_match_ : "common";
                        const issuer = new URL(as.issuer.replace(tenantId, tid));
                        const discoveryResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["discoveryRequest"](issuer, {
                            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]: provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]
                        });
                        as = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processDiscoveryResponse"](issuer, discoveryResponse);
                    }
                    break;
                }
            default:
                break;
        }
    }
    const processedCodeResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processAuthorizationCodeResponse"](as, client, codeGrantResponse, {
        expectedNonce: await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nonce"].use(cookies, resCookies, options),
        requireIdToken
    });
    const tokens = processedCodeResponse;
    if (requireIdToken) {
        const idTokenClaims = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getValidatedIdTokenClaims"](processedCodeResponse);
        profile = idTokenClaims;
        // Apple sends some of the user information in a `user` parameter as a stringified JSON.
        // It also only does so the first time the user consents to share their information.
        if (provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["conformInternal"]] && provider.id === "apple") {
            try {
                profile.user = JSON.parse(params === null || params === void 0 ? void 0 : params.user);
            } catch (e) {}
        }
        if (provider.idToken === false) {
            const userinfoResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userInfoRequest"](as, client, processedCodeResponse.access_token, {
                [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]: provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]],
                // TODO: move away from allowing insecure HTTP requests
                [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowInsecureRequests"]]: true
            });
            profile = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processUserInfoResponse"](as, client, idTokenClaims.sub, userinfoResponse);
        }
    } else {
        if (userinfo === null || userinfo === void 0 ? void 0 : userinfo.request) {
            const _profile = await userinfo.request({
                tokens,
                provider
            });
            if (_profile instanceof Object) profile = _profile;
        } else if (userinfo === null || userinfo === void 0 ? void 0 : userinfo.url) {
            const userinfoResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userInfoRequest"](as, client, processedCodeResponse.access_token, {
                [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]: provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]],
                // TODO: move away from allowing insecure HTTP requests
                [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowInsecureRequests"]]: true
            });
            profile = await userinfoResponse.json();
        } else {
            throw new TypeError("No userinfo endpoint configured");
        }
    }
    if (tokens.expires_in) {
        tokens.expires_at = Math.floor(Date.now() / 1000) + Number(tokens.expires_in);
    }
    const profileResult = await getUserAndAccount(profile, provider, tokens, logger);
    return {
        ...profileResult,
        profile,
        cookies: resCookies
    };
}
async function getUserAndAccount(OAuthProfile, provider, tokens, logger) {
    try {
        var _userFromProfile_email;
        const userFromProfile = await provider.profile(OAuthProfile, tokens);
        const user = {
            ...userFromProfile,
            // The user's id is intentionally not set based on the profile id, as
            // the user should remain independent of the provider and the profile id
            // is saved on the Account already, as `providerAccountId`.
            id: crypto.randomUUID(),
            email: (_userFromProfile_email = userFromProfile.email) === null || _userFromProfile_email === void 0 ? void 0 : _userFromProfile_email.toLowerCase()
        };
        var _userFromProfile_id;
        return {
            user,
            account: {
                ...tokens,
                provider: provider.id,
                type: provider.type,
                providerAccountId: (_userFromProfile_id = userFromProfile.id) !== null && _userFromProfile_id !== void 0 ? _userFromProfile_id : crypto.randomUUID()
            }
        };
    } catch (e) {
        // If we didn't get a response either there was a problem with the provider
        // response *or* the user cancelled the action with the provider.
        //
        // Unfortunately, we can't tell which - at least not in a way that works for
        // all providers, so we return an empty object; the user should then be
        // redirected back to the sign up page. We log the error to help developers
        // who might be trying to debug this when configuring a new provider.
        logger.debug("getProfile error details", OAuthProfile);
        logger.error(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OAuthProfileParseError"](e, {
            provider: provider.id
        }));
    }
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/webauthn-utils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertInternalOptionsWebAuthn",
    ()=>assertInternalOptionsWebAuthn,
    "fromBase64",
    ()=>fromBase64,
    "getAuthenticationResponse",
    ()=>getAuthenticationResponse,
    "getRegistrationResponse",
    ()=>getRegistrationResponse,
    "inferWebAuthnOptions",
    ()=>inferWebAuthnOptions,
    "stringToTransports",
    ()=>stringToTransports,
    "toBase64",
    ()=>toBase64,
    "transportsToString",
    ()=>transportsToString,
    "verifyAuthenticate",
    ()=>verifyAuthenticate,
    "verifyRegister",
    ()=>verifyRegister
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.2_@babel+core@7.2_0c38436d94fd4d44dcc71f4143339bd9/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/checks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/web.js [app-client] (ecmascript)");
;
;
;
function inferWebAuthnOptions(action, loggedIn, userInfoResponse) {
    const { user, exists = false } = userInfoResponse !== null && userInfoResponse !== void 0 ? userInfoResponse : {};
    switch(action){
        case "authenticate":
            {
                /**
             * Always allow explicit authentication requests.
             */ return "authenticate";
            }
        case "register":
            {
                /**
             * Registration is only allowed if:
             * - The user is logged in, meaning the user wants to register a new authenticator.
             * - The user is not logged in and provided user info that does NOT exist, meaning the user wants to register a new account.
             */ if (user && loggedIn === exists) return "register";
                break;
            }
        case undefined:
            {
                /**
             * When no explicit action is provided, we try to infer it based on the user info provided. These are the possible cases:
             * - Logged in users must always send an explit action, so we bail out in this case.
             * - Otherwise, if no user info is provided, the desired action is authentication without pre-defined authenticators.
             * - Otherwise, if the user info provided is of an existing user, the desired action is authentication with their pre-defined authenticators.
             * - Finally, if the user info provided is of a non-existing user, the desired action is registration.
             */ if (!loggedIn) {
                    if (user) {
                        if (exists) {
                            return "authenticate";
                        } else {
                            return "register";
                        }
                    } else {
                        return "authenticate";
                    }
                }
                break;
            }
    }
    // No decision could be made
    return null;
}
async function getRegistrationResponse(options, request, user, resCookies) {
    // Get registration options
    const regOptions = await getRegistrationOptions(options, request, user);
    // Get signed cookie
    const { cookie } = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webauthnChallenge"].create(options, regOptions.challenge, user);
    return {
        status: 200,
        cookies: [
            ...resCookies !== null && resCookies !== void 0 ? resCookies : [],
            cookie
        ],
        body: {
            action: "register",
            options: regOptions
        },
        headers: {
            "Content-Type": "application/json"
        }
    };
}
async function getAuthenticationResponse(options, request, user, resCookies) {
    // Get authentication options
    const authOptions = await getAuthenticationOptions(options, request, user);
    // Get signed cookie
    const { cookie } = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webauthnChallenge"].create(options, authOptions.challenge);
    return {
        status: 200,
        cookies: [
            ...resCookies !== null && resCookies !== void 0 ? resCookies : [],
            cookie
        ],
        body: {
            action: "authenticate",
            options: authOptions
        },
        headers: {
            "Content-Type": "application/json"
        }
    };
}
async function verifyAuthenticate(options, request, resCookies) {
    const { adapter, provider } = options;
    // Get WebAuthn response from request body
    const data = request.body && typeof request.body.data === "string" ? JSON.parse(request.body.data) : undefined;
    if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("Invalid WebAuthn Authentication response");
    }
    // Reset the ID so we smooth out implementation differences
    const credentialID = toBase64(fromBase64(data.id));
    // Get authenticator from database
    const authenticator = await adapter.getAuthenticator(credentialID);
    if (!authenticator) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("WebAuthn authenticator not found in database: ".concat(JSON.stringify({
            credentialID
        })));
    }
    // Get challenge from request cookies
    const { challenge: expectedChallenge } = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webauthnChallenge"].use(options, request.cookies, resCookies);
    // Verify the response
    let verification;
    try {
        const relayingParty = provider.getRelayingParty(options, request);
        verification = await provider.simpleWebAuthn.verifyAuthenticationResponse({
            ...provider.verifyAuthenticationOptions,
            expectedChallenge,
            response: data,
            authenticator: fromAdapterAuthenticator(authenticator),
            expectedOrigin: relayingParty.origin,
            expectedRPID: relayingParty.id
        });
    } catch (e) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebAuthnVerificationError"](e);
    }
    const { verified, authenticationInfo } = verification;
    // Make sure the response was verified
    if (!verified) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebAuthnVerificationError"]("WebAuthn authentication response could not be verified");
    }
    // Update authenticator counter
    try {
        const { newCounter } = authenticationInfo;
        await adapter.updateAuthenticatorCounter(authenticator.credentialID, newCounter);
    } catch (e) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdapterError"]("Failed to update authenticator counter. This may cause future authentication attempts to fail. ".concat(JSON.stringify({
            credentialID,
            oldCounter: authenticator.counter,
            newCounter: authenticationInfo.newCounter
        })), e);
    }
    // Get the account and user
    const account = await adapter.getAccount(authenticator.providerAccountId, provider.id);
    if (!account) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("WebAuthn account not found in database: ".concat(JSON.stringify({
            credentialID,
            providerAccountId: authenticator.providerAccountId
        })));
    }
    const user = await adapter.getUser(account.userId);
    if (!user) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("WebAuthn user not found in database: ".concat(JSON.stringify({
            credentialID,
            providerAccountId: authenticator.providerAccountId,
            userID: account.userId
        })));
    }
    return {
        account,
        user
    };
}
async function verifyRegister(options, request, resCookies) {
    const { provider } = options;
    // Get WebAuthn response from request body
    const data = request.body && typeof request.body.data === "string" ? JSON.parse(request.body.data) : undefined;
    if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("Invalid WebAuthn Registration response");
    }
    // Get challenge from request cookies
    const { challenge: expectedChallenge, registerData: user } = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webauthnChallenge"].use(options, request.cookies, resCookies);
    if (!user) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("Missing user registration data in WebAuthn challenge cookie");
    }
    // Verify the response
    let verification;
    try {
        const relayingParty = provider.getRelayingParty(options, request);
        verification = await provider.simpleWebAuthn.verifyRegistrationResponse({
            ...provider.verifyRegistrationOptions,
            expectedChallenge,
            response: data,
            expectedOrigin: relayingParty.origin,
            expectedRPID: relayingParty.id
        });
    } catch (e) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebAuthnVerificationError"](e);
    }
    // Make sure the response was verified
    if (!verification.verified || !verification.registrationInfo) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebAuthnVerificationError"]("WebAuthn registration response could not be verified");
    }
    // Build a new account
    const account = {
        providerAccountId: toBase64(verification.registrationInfo.credentialID),
        provider: options.provider.id,
        type: provider.type
    };
    // Build a new authenticator
    const authenticator = {
        providerAccountId: account.providerAccountId,
        counter: verification.registrationInfo.counter,
        credentialID: toBase64(verification.registrationInfo.credentialID),
        credentialPublicKey: toBase64(verification.registrationInfo.credentialPublicKey),
        credentialBackedUp: verification.registrationInfo.credentialBackedUp,
        credentialDeviceType: verification.registrationInfo.credentialDeviceType,
        transports: transportsToString(data.response.transports)
    };
    // Return created stuff
    return {
        user,
        account,
        authenticator
    };
}
/**
 * Generates WebAuthn authentication options.
 *
 * @param options - The internal options for WebAuthn.
 * @param request - The request object.
 * @param user - Optional user information.
 * @returns The authentication options.
 */ async function getAuthenticationOptions(options, request, user) {
    const { provider, adapter } = options;
    // Get the user's authenticators.
    const authenticators = user && user["id"] ? await adapter.listAuthenticatorsByUserId(user.id) : null;
    const relayingParty = provider.getRelayingParty(options, request);
    // Return the authentication options.
    return await provider.simpleWebAuthn.generateAuthenticationOptions({
        ...provider.authenticationOptions,
        rpID: relayingParty.id,
        allowCredentials: authenticators === null || authenticators === void 0 ? void 0 : authenticators.map((a)=>({
                id: fromBase64(a.credentialID),
                type: "public-key",
                transports: stringToTransports(a.transports)
            }))
    });
}
/**
 * Generates WebAuthn registration options.
 *
 * @param options - The internal options for WebAuthn.
 * @param request - The request object.
 * @param user - The user information.
 * @returns The registration options.
 */ async function getRegistrationOptions(options, request, user) {
    const { provider, adapter } = options;
    // Get the user's authenticators.
    const authenticators = user["id"] ? await adapter.listAuthenticatorsByUserId(user.id) : null;
    // Generate a random user ID for the credential.
    // We can do this because we don't use this user ID to link the
    // credential to the user. Instead, we store actual userID in the
    // Authenticator object and fetch it via it's credential ID.
    const userID = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["randomString"])(32);
    const relayingParty = provider.getRelayingParty(options, request);
    var _user_name;
    // Return the registration options.
    return await provider.simpleWebAuthn.generateRegistrationOptions({
        ...provider.registrationOptions,
        userID,
        userName: user.email,
        userDisplayName: (_user_name = user.name) !== null && _user_name !== void 0 ? _user_name : undefined,
        rpID: relayingParty.id,
        rpName: relayingParty.name,
        excludeCredentials: authenticators === null || authenticators === void 0 ? void 0 : authenticators.map((a)=>({
                id: fromBase64(a.credentialID),
                type: "public-key",
                transports: stringToTransports(a.transports)
            }))
    });
}
function assertInternalOptionsWebAuthn(options) {
    const { provider, adapter } = options;
    // Adapter is required for WebAuthn
    if (!adapter) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MissingAdapter"]("An adapter is required for the WebAuthn provider");
    // Provider must be WebAuthn
    if (!provider || provider.type !== "webauthn") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidProvider"]("Provider must be WebAuthn");
    }
    // Narrow the options type for typed usage later
    return {
        ...options,
        provider,
        adapter
    };
}
function fromAdapterAuthenticator(authenticator) {
    return {
        ...authenticator,
        credentialDeviceType: authenticator.credentialDeviceType,
        transports: stringToTransports(authenticator.transports),
        credentialID: fromBase64(authenticator.credentialID),
        credentialPublicKey: fromBase64(authenticator.credentialPublicKey)
    };
}
function fromBase64(base64) {
    return new Uint8Array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(base64, "base64"));
}
function toBase64(bytes) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(bytes).toString("base64");
}
function transportsToString(transports) {
    return transports === null || transports === void 0 ? void 0 : transports.join(",");
}
function stringToTransports(tstring) {
    return tstring ? tstring.split(",") : undefined;
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// TODO: Make this file smaller
__turbopack_context__.s([
    "callback",
    ()=>callback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$handle$2d$login$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/handle-login.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$callback$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/callback.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/checks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/web.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/webauthn-utils.js [app-client] (ecmascript)");
;
;
;
;
;
;
async function callback(request, options, sessionStore, cookies) {
    if (!options.provider) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidProvider"]("Callback route called without provider");
    const { query, body, method, headers } = request;
    const { provider, adapter, url, callbackUrl, pages, jwt, events, callbacks, session: { strategy: sessionStrategy, maxAge: sessionMaxAge }, logger } = options;
    const useJwtSession = sessionStrategy === "jwt";
    try {
        if (provider.type === "oauth" || provider.type === "oidc") {
            var _provider_authorization, _events_signIn;
            // Use body if the response mode is set to form_post. For all other cases, use query
            const params = ((_provider_authorization = provider.authorization) === null || _provider_authorization === void 0 ? void 0 : _provider_authorization.url.searchParams.get("response_mode")) === "form_post" ? body : query;
            // If we have a state and we are on a redirect proxy, we try to parse it
            // and see if it contains a valid origin to redirect to. If it does, we
            // redirect the user to that origin with the original state.
            if (options.isOnRedirectProxy && (params === null || params === void 0 ? void 0 : params.state)) {
                // NOTE: We rely on the state being encrypted using a shared secret
                // between the proxy and the original server.
                const parsedState = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["state"].decode(params.state, options);
                const shouldRedirect = (parsedState === null || parsedState === void 0 ? void 0 : parsedState.origin) && new URL(parsedState.origin).origin !== options.url.origin;
                if (shouldRedirect) {
                    const proxyRedirect = "".concat(parsedState.origin, "?").concat(new URLSearchParams(params));
                    logger.debug("Proxy redirecting to", proxyRedirect);
                    return {
                        redirect: proxyRedirect,
                        cookies
                    };
                }
            }
            const authorizationResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$callback$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handleOAuth"])(params, request.cookies, options);
            if (authorizationResult.cookies.length) {
                cookies.push(...authorizationResult.cookies);
            }
            logger.debug("authorization result", authorizationResult);
            const { user: userFromProvider, account, profile: OAuthProfile } = authorizationResult;
            // If we don't have a profile object then either something went wrong
            // or the user cancelled signing in. We don't know which, so we just
            // direct the user to the signin page for now. We could do something
            // else in future.
            // TODO: Handle user cancelling signin
            if (!userFromProvider || !account || !OAuthProfile) {
                return {
                    redirect: "".concat(url, "/signin"),
                    cookies
                };
            }
            // Check if user is allowed to sign in
            // Attempt to get Profile from OAuth provider details before invoking
            // signIn callback - but if no user object is returned, that is fine
            // (that just means it's a new user signing in for the first time).
            let userByAccount;
            if (adapter) {
                const { getUserByAccount } = adapter;
                userByAccount = await getUserByAccount({
                    providerAccountId: account.providerAccountId,
                    provider: provider.id
                });
            }
            const redirect = await handleAuthorized({
                user: userByAccount !== null && userByAccount !== void 0 ? userByAccount : userFromProvider,
                account,
                profile: OAuthProfile
            }, options);
            if (redirect) return {
                redirect,
                cookies
            };
            const { user, session, isNewUser } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$handle$2d$login$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handleLoginOrRegister"])(sessionStore.value, userFromProvider, account, options);
            if (useJwtSession) {
                var _user_id;
                const defaultToken = {
                    name: user.name,
                    email: user.email,
                    picture: user.image,
                    sub: (_user_id = user.id) === null || _user_id === void 0 ? void 0 : _user_id.toString()
                };
                const token = await callbacks.jwt({
                    token: defaultToken,
                    user,
                    account,
                    profile: OAuthProfile,
                    isNewUser,
                    trigger: isNewUser ? "signUp" : "signIn"
                });
                // Clear cookies if token is null
                if (token === null) {
                    cookies.push(...sessionStore.clean());
                } else {
                    const salt = options.cookies.sessionToken.name;
                    // Encode token
                    const newToken = await jwt.encode({
                        ...jwt,
                        token,
                        salt
                    });
                    // Set cookie expiry date
                    const cookieExpires = new Date();
                    cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1000);
                    const sessionCookies = sessionStore.chunk(newToken, {
                        expires: cookieExpires
                    });
                    cookies.push(...sessionCookies);
                }
            } else {
                // Save Session Token in cookie
                cookies.push({
                    name: options.cookies.sessionToken.name,
                    value: session.sessionToken,
                    options: {
                        ...options.cookies.sessionToken.options,
                        expires: session.expires
                    }
                });
            }
            await ((_events_signIn = events.signIn) === null || _events_signIn === void 0 ? void 0 : _events_signIn.call(events, {
                user,
                account,
                profile: OAuthProfile,
                isNewUser
            }));
            // Handle first logins on new accounts
            // e.g. option to send users to a new account landing page on initial login
            // Note that the callback URL is preserved, so the journey can still be resumed
            if (isNewUser && pages.newUser) {
                return {
                    redirect: "".concat(pages.newUser).concat(pages.newUser.includes("?") ? "&" : "?").concat(new URLSearchParams({
                        callbackUrl
                    })),
                    cookies
                };
            }
            return {
                redirect: callbackUrl,
                cookies
            };
        } else if (provider.type === "email") {
            var _events_signIn1;
            const paramToken = query === null || query === void 0 ? void 0 : query.token;
            const paramIdentifier = query === null || query === void 0 ? void 0 : query.email;
            if (!paramToken) {
                const e = new TypeError("Missing token. The sign-in URL was manually opened without token or the link was not sent correctly in the email.", {
                    cause: {
                        hasToken: !!paramToken
                    }
                });
                e.name = "Configuration";
                throw e;
            }
            var _provider_secret;
            const secret = (_provider_secret = provider.secret) !== null && _provider_secret !== void 0 ? _provider_secret : options.secret;
            // @ts-expect-error -- Verified in `assertConfig`.
            const invite = await adapter.useVerificationToken({
                // @ts-expect-error User-land adapters might decide to omit the identifier during lookup
                identifier: paramIdentifier,
                token: await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHash"])("".concat(paramToken).concat(secret))
            });
            const hasInvite = !!invite;
            const expired = hasInvite && invite.expires.valueOf() < Date.now();
            const invalidInvite = !hasInvite || expired || paramIdentifier && invite.identifier !== paramIdentifier;
            if (invalidInvite) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Verification"]({
                hasInvite,
                expired
            });
            const { identifier } = invite;
            var _ref;
            const user = (_ref = await adapter.getUserByEmail(identifier)) !== null && _ref !== void 0 ? _ref : {
                id: crypto.randomUUID(),
                email: identifier,
                emailVerified: null
            };
            const account = {
                providerAccountId: user.email,
                userId: user.id,
                type: "email",
                provider: provider.id
            };
            const redirect = await handleAuthorized({
                user,
                account
            }, options);
            if (redirect) return {
                redirect,
                cookies
            };
            // Sign user in
            const { user: loggedInUser, session, isNewUser } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$handle$2d$login$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handleLoginOrRegister"])(sessionStore.value, user, account, options);
            if (useJwtSession) {
                var _loggedInUser_id;
                const defaultToken = {
                    name: loggedInUser.name,
                    email: loggedInUser.email,
                    picture: loggedInUser.image,
                    sub: (_loggedInUser_id = loggedInUser.id) === null || _loggedInUser_id === void 0 ? void 0 : _loggedInUser_id.toString()
                };
                const token = await callbacks.jwt({
                    token: defaultToken,
                    user: loggedInUser,
                    account,
                    isNewUser,
                    trigger: isNewUser ? "signUp" : "signIn"
                });
                // Clear cookies if token is null
                if (token === null) {
                    cookies.push(...sessionStore.clean());
                } else {
                    const salt = options.cookies.sessionToken.name;
                    // Encode token
                    const newToken = await jwt.encode({
                        ...jwt,
                        token,
                        salt
                    });
                    // Set cookie expiry date
                    const cookieExpires = new Date();
                    cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1000);
                    const sessionCookies = sessionStore.chunk(newToken, {
                        expires: cookieExpires
                    });
                    cookies.push(...sessionCookies);
                }
            } else {
                // Save Session Token in cookie
                cookies.push({
                    name: options.cookies.sessionToken.name,
                    value: session.sessionToken,
                    options: {
                        ...options.cookies.sessionToken.options,
                        expires: session.expires
                    }
                });
            }
            await ((_events_signIn1 = events.signIn) === null || _events_signIn1 === void 0 ? void 0 : _events_signIn1.call(events, {
                user: loggedInUser,
                account,
                isNewUser
            }));
            // Handle first logins on new accounts
            // e.g. option to send users to a new account landing page on initial login
            // Note that the callback URL is preserved, so the journey can still be resumed
            if (isNewUser && pages.newUser) {
                return {
                    redirect: "".concat(pages.newUser).concat(pages.newUser.includes("?") ? "&" : "?").concat(new URLSearchParams({
                        callbackUrl
                    })),
                    cookies
                };
            }
            // Callback URL is already verified at this point, so safe to use if specified
            return {
                redirect: callbackUrl,
                cookies
            };
        } else if (provider.type === "credentials" && method === "POST") {
            var _user_id1, _events_signIn2;
            const credentials = body !== null && body !== void 0 ? body : {};
            // TODO: Forward the original request as is, instead of reconstructing it
            Object.entries(query !== null && query !== void 0 ? query : {}).forEach((param)=>{
                let [k, v] = param;
                return url.searchParams.set(k, v);
            });
            const userFromAuthorize = await provider.authorize(credentials, // prettier-ignore
            new Request(url, {
                headers,
                method,
                body: JSON.stringify(body)
            }));
            const user = userFromAuthorize;
            var _user_id_toString;
            if (!user) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CredentialsSignin"]();
            else user.id = (_user_id_toString = (_user_id1 = user.id) === null || _user_id1 === void 0 ? void 0 : _user_id1.toString()) !== null && _user_id_toString !== void 0 ? _user_id_toString : crypto.randomUUID();
            const account = {
                providerAccountId: user.id,
                type: "credentials",
                provider: provider.id
            };
            const redirect = await handleAuthorized({
                user,
                account,
                credentials
            }, options);
            if (redirect) return {
                redirect,
                cookies
            };
            const defaultToken = {
                name: user.name,
                email: user.email,
                picture: user.image,
                sub: user.id
            };
            const token = await callbacks.jwt({
                token: defaultToken,
                user,
                account,
                isNewUser: false,
                trigger: "signIn"
            });
            // Clear cookies if token is null
            if (token === null) {
                cookies.push(...sessionStore.clean());
            } else {
                const salt = options.cookies.sessionToken.name;
                // Encode token
                const newToken = await jwt.encode({
                    ...jwt,
                    token,
                    salt
                });
                // Set cookie expiry date
                const cookieExpires = new Date();
                cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1000);
                const sessionCookies = sessionStore.chunk(newToken, {
                    expires: cookieExpires
                });
                cookies.push(...sessionCookies);
            }
            await ((_events_signIn2 = events.signIn) === null || _events_signIn2 === void 0 ? void 0 : _events_signIn2.call(events, {
                user,
                account
            }));
            return {
                redirect: callbackUrl,
                cookies
            };
        } else if (provider.type === "webauthn" && method === "POST") {
            var _request_body, _events_signIn3;
            // Get callback action from request. It should be either "authenticate" or "register"
            const action = (_request_body = request.body) === null || _request_body === void 0 ? void 0 : _request_body.action;
            if (typeof action !== "string" || action !== "authenticate" && action !== "register") {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("Invalid action parameter");
            }
            // Return an error if the adapter is missing or if the provider
            // is not a webauthn provider.
            const localOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertInternalOptionsWebAuthn"])(options);
            // Verify request to get user, account and authenticator
            let user;
            let account;
            let authenticator;
            switch(action){
                case "authenticate":
                    {
                        const verified = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verifyAuthenticate"])(localOptions, request, cookies);
                        user = verified.user;
                        account = verified.account;
                        break;
                    }
                case "register":
                    {
                        const verified = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verifyRegister"])(options, request, cookies);
                        user = verified.user;
                        account = verified.account;
                        authenticator = verified.authenticator;
                        break;
                    }
            }
            // Check if user is allowed to sign in
            await handleAuthorized({
                user,
                account
            }, options);
            // Sign user in, creating them and their account if needed
            const { user: loggedInUser, isNewUser, session, account: currentAccount } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$handle$2d$login$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handleLoginOrRegister"])(sessionStore.value, user, account, options);
            if (!currentAccount) {
                // This is mostly for type checking. It should never actually happen.
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]("Error creating or finding account");
            }
            // Create new authenticator if needed
            if (authenticator && loggedInUser.id) {
                await localOptions.adapter.createAuthenticator({
                    ...authenticator,
                    userId: loggedInUser.id
                });
            }
            // Do the session registering dance
            if (useJwtSession) {
                var _loggedInUser_id1;
                const defaultToken = {
                    name: loggedInUser.name,
                    email: loggedInUser.email,
                    picture: loggedInUser.image,
                    sub: (_loggedInUser_id1 = loggedInUser.id) === null || _loggedInUser_id1 === void 0 ? void 0 : _loggedInUser_id1.toString()
                };
                const token = await callbacks.jwt({
                    token: defaultToken,
                    user: loggedInUser,
                    account: currentAccount,
                    isNewUser,
                    trigger: isNewUser ? "signUp" : "signIn"
                });
                // Clear cookies if token is null
                if (token === null) {
                    cookies.push(...sessionStore.clean());
                } else {
                    const salt = options.cookies.sessionToken.name;
                    // Encode token
                    const newToken = await jwt.encode({
                        ...jwt,
                        token,
                        salt
                    });
                    // Set cookie expiry date
                    const cookieExpires = new Date();
                    cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1000);
                    const sessionCookies = sessionStore.chunk(newToken, {
                        expires: cookieExpires
                    });
                    cookies.push(...sessionCookies);
                }
            } else {
                // Save Session Token in cookie
                cookies.push({
                    name: options.cookies.sessionToken.name,
                    value: session.sessionToken,
                    options: {
                        ...options.cookies.sessionToken.options,
                        expires: session.expires
                    }
                });
            }
            await ((_events_signIn3 = events.signIn) === null || _events_signIn3 === void 0 ? void 0 : _events_signIn3.call(events, {
                user: loggedInUser,
                account: currentAccount,
                isNewUser
            }));
            // Handle first logins on new accounts
            // e.g. option to send users to a new account landing page on initial login
            // Note that the callback URL is preserved, so the journey can still be resumed
            if (isNewUser && pages.newUser) {
                return {
                    redirect: "".concat(pages.newUser).concat(pages.newUser.includes("?") ? "&" : "?").concat(new URLSearchParams({
                        callbackUrl
                    })),
                    cookies
                };
            }
            // Callback URL is already verified at this point, so safe to use if specified
            return {
                redirect: callbackUrl,
                cookies
            };
        }
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InvalidProvider"]("Callback for provider type (".concat(provider.type, ") is not supported"));
    } catch (e) {
        if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]) throw e;
        const error = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CallbackRouteError"](e, {
            provider: provider.id
        });
        logger.debug("callback route error details", {
            method,
            query,
            body
        });
        throw error;
    }
}
async function handleAuthorized(params, config) {
    let authorized;
    const { signIn, redirect } = config.callbacks;
    try {
        authorized = await signIn(params);
    } catch (e) {
        if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"]) throw e;
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccessDenied"](e);
    }
    if (!authorized) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccessDenied"]("AccessDenied");
    if (typeof authorized !== "string") return;
    return await redirect({
        url: authorized,
        baseUrl: config.url.origin
    });
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/session.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "session",
    ()=>session
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/date.js [app-client] (ecmascript)");
;
;
async function session(options, sessionStore, cookies, isUpdate, newSession) {
    const { adapter, jwt, events, callbacks, logger, session: { strategy: sessionStrategy, maxAge: sessionMaxAge } } = options;
    const response = {
        body: null,
        headers: {
            "Content-Type": "application/json",
            ...!isUpdate && {
                "Cache-Control": "private, no-cache, no-store",
                Expires: "0",
                Pragma: "no-cache"
            }
        },
        cookies
    };
    const sessionToken = sessionStore.value;
    if (!sessionToken) return response;
    if (sessionStrategy === "jwt") {
        try {
            const salt = options.cookies.sessionToken.name;
            const payload = await jwt.decode({
                ...jwt,
                token: sessionToken,
                salt
            });
            if (!payload) throw new Error("Invalid JWT");
            // @ts-expect-error
            const token = await callbacks.jwt({
                token: payload,
                ...isUpdate && {
                    trigger: "update"
                },
                session: newSession
            });
            const newExpires = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(sessionMaxAge);
            if (token !== null) {
                var _response_cookies, _events_session;
                // By default, only exposes a limited subset of information to the client
                // as needed for presentation purposes (e.g. "you are logged in as...").
                const session = {
                    user: {
                        name: token.name,
                        email: token.email,
                        image: token.picture
                    },
                    expires: newExpires.toISOString()
                };
                // @ts-expect-error
                const newSession = await callbacks.session({
                    session,
                    token
                });
                // Return session payload as response
                response.body = newSession;
                // Refresh JWT expiry by re-signing it, with an updated expiry date
                const newToken = await jwt.encode({
                    ...jwt,
                    token,
                    salt
                });
                // Set cookie, to also update expiry date on cookie
                const sessionCookies = sessionStore.chunk(newToken, {
                    expires: newExpires
                });
                (_response_cookies = response.cookies) === null || _response_cookies === void 0 ? void 0 : _response_cookies.push(...sessionCookies);
                await ((_events_session = events.session) === null || _events_session === void 0 ? void 0 : _events_session.call(events, {
                    session: newSession,
                    token
                }));
            } else {
                var _response_cookies1;
                (_response_cookies1 = response.cookies) === null || _response_cookies1 === void 0 ? void 0 : _response_cookies1.push(...sessionStore.clean());
            }
        } catch (e) {
            var // If the JWT is not verifiable remove the broken session cookie(s).
            _response_cookies2;
            logger.error(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["JWTSessionError"](e));
            (_response_cookies2 = response.cookies) === null || _response_cookies2 === void 0 ? void 0 : _response_cookies2.push(...sessionStore.clean());
        }
        return response;
    }
    // Retrieve session from database
    try {
        const { getSessionAndUser, deleteSession, updateSession } = adapter;
        let userAndSession = await getSessionAndUser(sessionToken);
        // If session has expired, clean up the database
        if (userAndSession && userAndSession.session.expires.valueOf() < Date.now()) {
            await deleteSession(sessionToken);
            userAndSession = null;
        }
        if (userAndSession) {
            var // Set cookie again to update expiry
            _response_cookies3, _events_session1;
            const { user, session } = userAndSession;
            const sessionUpdateAge = options.session.updateAge;
            // Calculate last updated date to throttle write updates to database
            // Formula: ({expiry date} - sessionMaxAge) + sessionUpdateAge
            //     e.g. ({expiry date} - 30 days) + 1 hour
            const sessionIsDueToBeUpdatedDate = session.expires.valueOf() - sessionMaxAge * 1000 + sessionUpdateAge * 1000;
            const newExpires = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$date$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromDate"])(sessionMaxAge);
            // Trigger update of session expiry date and write to database, only
            // if the session was last updated more than {sessionUpdateAge} ago
            if (sessionIsDueToBeUpdatedDate <= Date.now()) {
                await updateSession({
                    sessionToken: sessionToken,
                    expires: newExpires
                });
            }
            // Pass Session through to the session callback
            const sessionPayload = await callbacks.session({
                // TODO: user already passed below,
                // remove from session object in https://github.com/nextauthjs/next-auth/pull/9702
                // @ts-expect-error
                session: {
                    ...session,
                    user
                },
                user,
                newSession,
                ...isUpdate ? {
                    trigger: "update"
                } : {}
            });
            // Return session payload as response
            response.body = sessionPayload;
            (_response_cookies3 = response.cookies) === null || _response_cookies3 === void 0 ? void 0 : _response_cookies3.push({
                name: options.cookies.sessionToken.name,
                value: sessionToken,
                options: {
                    ...options.cookies.sessionToken.options,
                    expires: newExpires
                }
            });
            // @ts-expect-error
            await ((_events_session1 = events.session) === null || _events_session1 === void 0 ? void 0 : _events_session1.call(events, {
                session: sessionPayload
            }));
        } else if (sessionToken) {
            var // If `sessionToken` was found set but it's not valid for a session then
            // remove the sessionToken cookie from browser.
            _response_cookies4;
            (_response_cookies4 = response.cookies) === null || _response_cookies4 === void 0 ? void 0 : _response_cookies4.push(...sessionStore.clean());
        }
    } catch (e) {
        logger.error(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SessionTokenError"](e));
    }
    return response;
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/authorization-url.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAuthorizationUrl",
    ()=>getAuthorizationUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/checks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/oauth4webapi@3.8.1/node_modules/oauth4webapi/build/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/symbols.js [app-client] (ecmascript)");
;
;
;
async function getAuthorizationUrl(query, options) {
    var _provider_authorization, _provider_authorization1, _provider_authorization2, // Otherwise "POST /redirect_uri" wouldn't include the cookies
    _provider_authorization3, _provider_checks;
    const { logger, provider } = options;
    let url = (_provider_authorization = provider.authorization) === null || _provider_authorization === void 0 ? void 0 : _provider_authorization.url;
    let as;
    // Falls back to authjs.dev if the user only passed params
    if (!url || url.host === "authjs.dev") {
        // If url is undefined, we assume that issuer is always defined
        // We check this in assert.ts
        const issuer = new URL(provider.issuer);
        const discoveryResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["discoveryRequest"](issuer, {
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]]: provider[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["customFetch"]],
            // TODO: move away from allowing insecure HTTP requests
            [__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allowInsecureRequests"]]: true
        });
        const as = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$oauth4webapi$40$3$2e$8$2e$1$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processDiscoveryResponse"](issuer, discoveryResponse).catch((error)=>{
            if (!(error instanceof TypeError) || error.message !== "Invalid URL") throw error;
            throw new TypeError("Discovery request responded with an invalid issuer. expected: ".concat(issuer));
        });
        if (!as.authorization_endpoint) {
            throw new TypeError("Authorization server did not provide an authorization endpoint.");
        }
        url = new URL(as.authorization_endpoint);
    }
    const authParams = url.searchParams;
    let redirect_uri = provider.callbackUrl;
    let data;
    if (!options.isOnRedirectProxy && provider.redirectProxyUrl) {
        redirect_uri = provider.redirectProxyUrl;
        data = provider.callbackUrl;
        logger.debug("using redirect proxy", {
            redirect_uri,
            data
        });
    }
    var _provider_authorization_url_searchParams;
    const params = Object.assign({
        response_type: "code",
        // clientId can technically be undefined, should we check this in assert.ts or rely on the Authorization Server to do it?
        client_id: provider.clientId,
        redirect_uri,
        ...(_provider_authorization1 = provider.authorization) === null || _provider_authorization1 === void 0 ? void 0 : _provider_authorization1.params
    }, Object.fromEntries((_provider_authorization_url_searchParams = (_provider_authorization2 = provider.authorization) === null || _provider_authorization2 === void 0 ? void 0 : _provider_authorization2.url.searchParams) !== null && _provider_authorization_url_searchParams !== void 0 ? _provider_authorization_url_searchParams : []), query);
    for(const k in params)authParams.set(k, params[k]);
    const cookies = [];
    if (((_provider_authorization3 = provider.authorization) === null || _provider_authorization3 === void 0 ? void 0 : _provider_authorization3.url.searchParams.get("response_mode")) === "form_post") {
        options.cookies.state.options.sameSite = "none";
        options.cookies.state.options.secure = true;
        options.cookies.nonce.options.sameSite = "none";
        options.cookies.nonce.options.secure = true;
    }
    const state = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["state"].create(options, data);
    if (state) {
        authParams.set("state", state.value);
        cookies.push(state.cookie);
    }
    if ((_provider_checks = provider.checks) === null || _provider_checks === void 0 ? void 0 : _provider_checks.includes("pkce")) {
        var _as_code_challenge_methods_supported;
        if (as && !((_as_code_challenge_methods_supported = as.code_challenge_methods_supported) === null || _as_code_challenge_methods_supported === void 0 ? void 0 : _as_code_challenge_methods_supported.includes("S256"))) {
            // We assume S256 PKCE support, if the server does not advertise that,
            // a random `nonce` must be used for CSRF protection.
            if (provider.type === "oidc") provider.checks = [
                "nonce"
            ];
        } else {
            const { value, cookie } = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pkce"].create(options);
            authParams.set("code_challenge", value);
            authParams.set("code_challenge_method", "S256");
            cookies.push(cookie);
        }
    }
    const nonce = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$checks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nonce"].create(options);
    if (nonce) {
        authParams.set("nonce", nonce.value);
        cookies.push(nonce.cookie);
    }
    // TODO: This does not work in normalizeOAuth because authorization endpoint can come from discovery
    // Need to make normalizeOAuth async
    if (provider.type === "oidc" && !url.searchParams.has("scope")) {
        url.searchParams.set("scope", "openid profile email");
    }
    logger.debug("authorization url is ready", {
        url,
        cookies,
        provider
    });
    return {
        redirect: url.toString(),
        cookies
    };
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/send-token.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendToken",
    ()=>sendToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/web.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
;
;
async function sendToken(request, options) {
    var _provider_generateVerificationToken, _adapter_createVerificationToken;
    const { body } = request;
    const { provider, callbacks, adapter } = options;
    var _provider_normalizeIdentifier;
    const normalizer = (_provider_normalizeIdentifier = provider.normalizeIdentifier) !== null && _provider_normalizeIdentifier !== void 0 ? _provider_normalizeIdentifier : defaultNormalizer;
    const email = normalizer(body === null || body === void 0 ? void 0 : body.email);
    const defaultUser = {
        id: crypto.randomUUID(),
        email,
        emailVerified: null
    };
    var _ref;
    const user = (_ref = await adapter.getUserByEmail(email)) !== null && _ref !== void 0 ? _ref : defaultUser;
    const account = {
        providerAccountId: email,
        userId: user.id,
        type: "email",
        provider: provider.id
    };
    let authorized;
    try {
        authorized = await callbacks.signIn({
            user,
            account,
            email: {
                verificationRequest: true
            }
        });
    } catch (e) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccessDenied"](e);
    }
    if (!authorized) throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccessDenied"]("AccessDenied");
    if (typeof authorized === "string") {
        return {
            redirect: await callbacks.redirect({
                url: authorized,
                baseUrl: options.url.origin
            })
        };
    }
    const { callbackUrl, theme } = options;
    var _ref1;
    const token = (_ref1 = await ((_provider_generateVerificationToken = provider.generateVerificationToken) === null || _provider_generateVerificationToken === void 0 ? void 0 : _provider_generateVerificationToken.call(provider))) !== null && _ref1 !== void 0 ? _ref1 : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["randomString"])(32);
    const ONE_DAY_IN_SECONDS = 86400;
    var _provider_maxAge;
    const expires = new Date(Date.now() + ((_provider_maxAge = provider.maxAge) !== null && _provider_maxAge !== void 0 ? _provider_maxAge : ONE_DAY_IN_SECONDS) * 1000);
    var _provider_secret;
    const secret = (_provider_secret = provider.secret) !== null && _provider_secret !== void 0 ? _provider_secret : options.secret;
    const baseUrl = new URL(options.basePath, options.url.origin);
    const sendRequest = provider.sendVerificationRequest({
        identifier: email,
        token,
        expires,
        url: "".concat(baseUrl, "/callback/").concat(provider.id, "?").concat(new URLSearchParams({
            callbackUrl,
            token,
            email
        })),
        provider,
        theme,
        request: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toRequest"])(request)
    });
    const createToken = (_adapter_createVerificationToken = adapter.createVerificationToken) === null || _adapter_createVerificationToken === void 0 ? void 0 : _adapter_createVerificationToken.call(adapter, {
        identifier: email,
        token: await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createHash"])("".concat(token).concat(secret)),
        expires
    });
    await Promise.all([
        sendRequest,
        createToken
    ]);
    return {
        redirect: "".concat(baseUrl, "/verify-request?").concat(new URLSearchParams({
            provider: provider.id,
            type: provider.type
        }))
    };
}
function defaultNormalizer(email) {
    if (!email) throw new Error("Missing email from request body.");
    // Get the first two elements only,
    // separated by `@` from user input.
    let [local, domain] = email.toLowerCase().trim().split("@");
    // The part before "@" can contain a ","
    // but we remove it on the domain part
    domain = domain.split(",")[0];
    return "".concat(local, "@").concat(domain);
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "signIn",
    ()=>signIn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$authorization$2d$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/authorization-url.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$send$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/send-token.js [app-client] (ecmascript)");
;
;
async function signIn(request, cookies, options) {
    const signInUrl = "".concat(options.url.origin).concat(options.basePath, "/signin");
    if (!options.provider) return {
        redirect: signInUrl,
        cookies
    };
    switch(options.provider.type){
        case "oauth":
        case "oidc":
            {
                const { redirect, cookies: authCookies } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$authorization$2d$url$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthorizationUrl"])(request.query, options);
                if (authCookies) cookies.push(...authCookies);
                return {
                    redirect,
                    cookies
                };
            }
        case "email":
            {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$send$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sendToken"])(request, options);
                return {
                    ...response,
                    cookies
                };
            }
        default:
            return {
                redirect: signInUrl,
                cookies
            };
    }
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signout.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
;
async function signOut(cookies, sessionStore, options) {
    const { jwt, events, callbackUrl: redirect, logger, session } = options;
    const sessionToken = sessionStore.value;
    if (!sessionToken) return {
        redirect,
        cookies
    };
    try {
        if (session.strategy === "jwt") {
            var _events_signOut;
            const salt = options.cookies.sessionToken.name;
            const token = await jwt.decode({
                ...jwt,
                token: sessionToken,
                salt
            });
            await ((_events_signOut = events.signOut) === null || _events_signOut === void 0 ? void 0 : _events_signOut.call(events, {
                token
            }));
        } else {
            var _options_adapter, _events_signOut1;
            const session = await ((_options_adapter = options.adapter) === null || _options_adapter === void 0 ? void 0 : _options_adapter.deleteSession(sessionToken));
            await ((_events_signOut1 = events.signOut) === null || _events_signOut1 === void 0 ? void 0 : _events_signOut1.call(events, {
                session
            }));
        }
    } catch (e) {
        logger.error(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SignOutError"](e));
    }
    cookies.push(...sessionStore.clean());
    return {
        redirect,
        cookies
    };
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/session.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Returns the currently logged in user, if any.
 */ __turbopack_context__.s([
    "getLoggedInUser",
    ()=>getLoggedInUser
]);
async function getLoggedInUser(options, sessionStore) {
    const { adapter, jwt, session: { strategy: sessionStrategy } } = options;
    const sessionToken = sessionStore.value;
    if (!sessionToken) return null;
    // Try to decode JWT
    if (sessionStrategy === "jwt") {
        const salt = options.cookies.sessionToken.name;
        const payload = await jwt.decode({
            ...jwt,
            token: sessionToken,
            salt
        });
        if (payload && payload.sub) {
            return {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                image: payload.picture
            };
        }
    } else {
        const userAndSession = await (adapter === null || adapter === void 0 ? void 0 : adapter.getSessionAndUser(sessionToken));
        if (userAndSession) {
            return userAndSession.user;
        }
    }
    return null;
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/webauthn-options.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "webAuthnOptions",
    ()=>webAuthnOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/session.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/webauthn-utils.js [app-client] (ecmascript)");
;
;
async function webAuthnOptions(request, options, sessionStore, cookies) {
    // Return an error if the adapter is missing or if the provider
    // is not a webauthn provider.
    const narrowOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertInternalOptionsWebAuthn"])(options);
    const { provider } = narrowOptions;
    var _request_query;
    // Extract the action from the query parameters
    const { action } = (_request_query = request.query) !== null && _request_query !== void 0 ? _request_query : {};
    // Action must be either "register", "authenticate", or undefined
    if (action !== "register" && action !== "authenticate" && typeof action !== "undefined") {
        return {
            status: 400,
            body: {
                error: "Invalid action"
            },
            cookies,
            headers: {
                "Content-Type": "application/json"
            }
        };
    }
    // Get the user info from the session
    const sessionUser = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLoggedInUser"])(options, sessionStore);
    // Extract user info from request
    // If session user exists, we don't need to call getUserInfo
    const getUserInfoResponse = sessionUser ? {
        user: sessionUser,
        exists: true
    } : await provider.getUserInfo(options, request);
    const userInfo = getUserInfoResponse === null || getUserInfoResponse === void 0 ? void 0 : getUserInfoResponse.user;
    // Make a decision on what kind of webauthn options to return
    const decision = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["inferWebAuthnOptions"])(action, !!sessionUser, getUserInfoResponse);
    switch(decision){
        case "authenticate":
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthenticationResponse"])(narrowOptions, request, userInfo, cookies);
        case "register":
            if (typeof (userInfo === null || userInfo === void 0 ? void 0 : userInfo.email) === "string") {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$webauthn$2d$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRegistrationResponse"])(narrowOptions, request, userInfo, cookies);
            }
            break;
        default:
            return {
                status: 400,
                body: {
                    error: "Invalid request"
                },
                cookies,
                headers: {
                    "Content-Type": "application/json"
                }
            };
    }
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/session.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$webauthn$2d$options$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/webauthn-options.js [app-client] (ecmascript)");
;
;
;
;
;
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthInternal",
    ()=>AuthInternal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/cookie.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$init$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/init.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/session.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signin/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/signout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$webauthn$2d$options$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/webauthn-options.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/actions/callback/oauth/csrf-token.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/symbols.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
async function AuthInternal(request, authOptions) {
    var _request_body, _request_query, _request_body1;
    const { action, providerId, error, method } = request;
    const csrfDisabled = authOptions.skipCSRFCheck === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["skipCSRFCheck"];
    var _request_body_callbackUrl;
    const { options, cookies } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$init$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["init"])({
        authOptions,
        action,
        providerId,
        url: request.url,
        callbackUrl: (_request_body_callbackUrl = (_request_body = request.body) === null || _request_body === void 0 ? void 0 : _request_body.callbackUrl) !== null && _request_body_callbackUrl !== void 0 ? _request_body_callbackUrl : (_request_query = request.query) === null || _request_query === void 0 ? void 0 : _request_query.callbackUrl,
        csrfToken: (_request_body1 = request.body) === null || _request_body1 === void 0 ? void 0 : _request_body1.csrfToken,
        cookies: request.cookies,
        isPost: method === "POST",
        csrfDisabled
    });
    const sessionStore = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$cookie$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SessionStore"](options.cookies.sessionToken, request.cookies, options.logger);
    if (method === "GET") {
        const render = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
            ...options,
            query: request.query,
            cookies
        });
        switch(action){
            case "callback":
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callback"](request, options, sessionStore, cookies);
            case "csrf":
                return render.csrf(csrfDisabled, options, cookies);
            case "error":
                return render.error(error);
            case "providers":
                return render.providers(options.providers);
            case "session":
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["session"](options, sessionStore, cookies);
            case "signin":
                return render.signin(providerId, error);
            case "signout":
                return render.signout();
            case "verify-request":
                return render.verifyRequest();
            case "webauthn-options":
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$webauthn$2d$options$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["webAuthnOptions"](request, options, sessionStore, cookies);
            default:
        }
    } else {
        const { csrfTokenVerified } = options;
        switch(action){
            case "callback":
                if (options.provider.type === "credentials") // Verified CSRF Token required for credentials providers only
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCSRF"])(action, csrfTokenVerified);
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callback"](request, options, sessionStore, cookies);
            case "session":
                var _request_body2;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCSRF"])(action, csrfTokenVerified);
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$session$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["session"](options, sessionStore, cookies, true, (_request_body2 = request.body) === null || _request_body2 === void 0 ? void 0 : _request_body2.data);
            case "signin":
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCSRF"])(action, csrfTokenVerified);
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signin$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signIn"](request, cookies, options);
            case "signout":
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$callback$2f$oauth$2f$csrf$2d$token$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCSRF"])(action, csrfTokenVerified);
                return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$actions$2f$signout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"](cookies, sessionStore, options);
            default:
        }
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnknownAction"]("Cannot handle action: ".concat(action));
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/env.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createActionURL",
    ()=>createActionURL,
    "setEnvDefaults",
    ()=>setEnvDefaults
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/logger.js [app-client] (ecmascript)");
;
function setEnvDefaults(envObject, config) {
    let suppressBasePathWarning = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    var _config_secret;
    try {
        const url = envObject.AUTH_URL;
        if (url) {
            if (config.basePath) {
                if (!suppressBasePathWarning) {
                    const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLogger"])(config);
                    logger.warn("env-url-basepath-redundant");
                }
            } else {
                config.basePath = new URL(url).pathname;
            }
        }
    } catch (e) {
    // Catching and swallowing potential URL parsing errors, we'll fall
    // back to `/auth` below.
    } finally{
        var _config_basePath;
        (_config_basePath = config.basePath) !== null && _config_basePath !== void 0 ? _config_basePath : config.basePath = "/auth";
    }
    if (!((_config_secret = config.secret) === null || _config_secret === void 0 ? void 0 : _config_secret.length)) {
        config.secret = [];
        const secret = envObject.AUTH_SECRET;
        if (secret) config.secret.push(secret);
        for (const i of [
            1,
            2,
            3
        ]){
            const secret = envObject["AUTH_SECRET_".concat(i)];
            if (secret) config.secret.unshift(secret);
        }
    }
    var _config_redirectProxyUrl;
    (_config_redirectProxyUrl = config.redirectProxyUrl) !== null && _config_redirectProxyUrl !== void 0 ? _config_redirectProxyUrl : config.redirectProxyUrl = envObject.AUTH_REDIRECT_PROXY_URL;
    var _envObject_AUTH_URL, _ref, _ref1, _ref2, _config_trustHost;
    (_config_trustHost = config.trustHost) !== null && _config_trustHost !== void 0 ? _config_trustHost : config.trustHost = !!((_ref2 = (_ref1 = (_ref = (_envObject_AUTH_URL = envObject.AUTH_URL) !== null && _envObject_AUTH_URL !== void 0 ? _envObject_AUTH_URL : envObject.AUTH_TRUST_HOST) !== null && _ref !== void 0 ? _ref : envObject.VERCEL) !== null && _ref1 !== void 0 ? _ref1 : envObject.CF_PAGES) !== null && _ref2 !== void 0 ? _ref2 : envObject.NODE_ENV !== "production");
    config.providers = config.providers.map((provider)=>{
        const { id } = typeof provider === "function" ? provider({}) : provider;
        const ID = id.toUpperCase().replace(/-/g, "_");
        const clientId = envObject["AUTH_".concat(ID, "_ID")];
        const clientSecret = envObject["AUTH_".concat(ID, "_SECRET")];
        const issuer = envObject["AUTH_".concat(ID, "_ISSUER")];
        const apiKey = envObject["AUTH_".concat(ID, "_KEY")];
        const finalProvider = typeof provider === "function" ? provider({
            clientId,
            clientSecret,
            issuer,
            apiKey
        }) : provider;
        if (finalProvider.type === "oauth" || finalProvider.type === "oidc") {
            var _finalProvider_clientId;
            (_finalProvider_clientId = finalProvider.clientId) !== null && _finalProvider_clientId !== void 0 ? _finalProvider_clientId : finalProvider.clientId = clientId;
            var _finalProvider_clientSecret;
            (_finalProvider_clientSecret = finalProvider.clientSecret) !== null && _finalProvider_clientSecret !== void 0 ? _finalProvider_clientSecret : finalProvider.clientSecret = clientSecret;
            var _finalProvider_issuer;
            (_finalProvider_issuer = finalProvider.issuer) !== null && _finalProvider_issuer !== void 0 ? _finalProvider_issuer : finalProvider.issuer = issuer;
        } else if (finalProvider.type === "email") {
            var _finalProvider_apiKey;
            (_finalProvider_apiKey = finalProvider.apiKey) !== null && _finalProvider_apiKey !== void 0 ? _finalProvider_apiKey : finalProvider.apiKey = apiKey;
        }
        return finalProvider;
    });
}
function createActionURL(action, protocol, headers, envObject, config) {
    const basePath = config === null || config === void 0 ? void 0 : config.basePath;
    var _envObject_AUTH_URL;
    const envUrl = (_envObject_AUTH_URL = envObject.AUTH_URL) !== null && _envObject_AUTH_URL !== void 0 ? _envObject_AUTH_URL : envObject.NEXTAUTH_URL;
    let url;
    if (envUrl) {
        url = new URL(envUrl);
        if (basePath && basePath !== "/" && url.pathname !== "/") {
            if (url.pathname !== basePath) {
                const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLogger"])(config);
                logger.warn("env-url-basepath-mismatch");
            }
            url.pathname = "/";
        }
    } else {
        var _headers_get;
        const detectedHost = (_headers_get = headers.get("x-forwarded-host")) !== null && _headers_get !== void 0 ? _headers_get : headers.get("host");
        var _headers_get1, _ref;
        const detectedProtocol = (_ref = (_headers_get1 = headers.get("x-forwarded-proto")) !== null && _headers_get1 !== void 0 ? _headers_get1 : protocol) !== null && _ref !== void 0 ? _ref : "https";
        const _protocol = detectedProtocol.endsWith(":") ? detectedProtocol : detectedProtocol + ":";
        url = new URL("".concat(_protocol, "//").concat(detectedHost));
    }
    // remove trailing slash
    const sanitizedUrl = url.toString().replace(/\/$/, "");
    if (basePath) {
        var _basePath_replace;
        // remove leading and trailing slash
        const sanitizedBasePath = (_basePath_replace = basePath === null || basePath === void 0 ? void 0 : basePath.replace(/(^\/|\/$)/g, "")) !== null && _basePath_replace !== void 0 ? _basePath_replace : "";
        return new URL("".concat(sanitizedUrl, "/").concat(sanitizedBasePath, "/").concat(action));
    }
    return new URL("".concat(sanitizedUrl, "/").concat(action));
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 *
 * :::warning Experimental
 * `@auth/core` is under active development.
 * :::
 *
 * This is the main entry point to the Auth.js library.
 *
 * Based on the {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Request}
 * and {@link https://developer.mozilla.org/en-US/docs/Web/API/Response Response} Web standard APIs.
 * Primarily used to implement [framework](https://authjs.dev/getting-started/integrations)-specific packages,
 * but it can also be used directly.
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/core
 * ```
 *
 * ## Usage
 *
 * ```ts
 * import { Auth } from "@auth/core"
 *
 * const request = new Request("https://example.com")
 * const response = await Auth(request, {...})
 *
 * console.log(response instanceof Response) // true
 * ```
 *
 * ## Resources
 *
 * - [Getting started](https://authjs.dev/getting-started)
 * - [Guides](https://authjs.dev/guides)
 *
 * @module @auth/core
 */ __turbopack_context__.s([
    "Auth",
    ()=>Auth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$assert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/assert.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/symbols.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/env.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/pages/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/logger.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/web.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$actions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/lib/utils/actions.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
async function Auth(request, config) {
    var _request_headers;
    const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$logger$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setLogger"])(config);
    const internalRequest = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toInternalRequest"])(request, config);
    // There was an error parsing the request
    if (!internalRequest) return Response.json("Bad request.", {
        status: 400
    });
    const warningsOrError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$assert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertConfig"])(internalRequest, config);
    if (Array.isArray(warningsOrError)) {
        warningsOrError.forEach(logger.warn);
    } else if (warningsOrError) {
        var _internalRequest_url_searchParams_get;
        // If there's an error in the user config, bail out early
        logger.error(warningsOrError);
        const htmlPages = new Set([
            "signin",
            "signout",
            "error",
            "verify-request"
        ]);
        if (!htmlPages.has(internalRequest.action) || internalRequest.method !== "GET") {
            const message = "There was a problem with the server configuration. Check the server logs for more information.";
            return Response.json({
                message
            }, {
                status: 500
            });
        }
        const { pages, theme } = config;
        // If this is true, the config required auth on the error page
        // which could cause a redirect loop
        const authOnErrorPage = (pages === null || pages === void 0 ? void 0 : pages.error) && ((_internalRequest_url_searchParams_get = internalRequest.url.searchParams.get("callbackUrl")) === null || _internalRequest_url_searchParams_get === void 0 ? void 0 : _internalRequest_url_searchParams_get.startsWith(pages.error));
        // Either there was no error page configured or the configured one contains infinite redirects
        if (!(pages === null || pages === void 0 ? void 0 : pages.error) || authOnErrorPage) {
            if (authOnErrorPage) {
                logger.error(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ErrorPageLoop"]("The error page ".concat(pages === null || pages === void 0 ? void 0 : pages.error, " should not require authentication")));
            }
            const page = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$pages$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
                theme
            }).error("Configuration");
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toResponse"])(page);
        }
        const url = "".concat(internalRequest.url.origin).concat(pages.error, "?error=Configuration");
        return Response.redirect(url);
    }
    const isRedirect = (_request_headers = request.headers) === null || _request_headers === void 0 ? void 0 : _request_headers.has("X-Auth-Return-Redirect");
    const isRaw = config.raw === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$symbols$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["raw"];
    try {
        const internalResponse = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AuthInternal"])(internalRequest, config);
        if (isRaw) return internalResponse;
        const response = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$lib$2f$utils$2f$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toResponse"])(internalResponse);
        const url = response.headers.get("Location");
        if (!isRedirect || !url) return response;
        return Response.json({
            url
        }, {
            headers: response.headers
        });
    } catch (e) {
        var _config_pages;
        const error = e;
        logger.error(error);
        const isAuthError = error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthError"];
        if (isAuthError && isRaw && !isRedirect) throw error;
        // If the CSRF check failed for POST/session, return a 400 status code.
        // We should not redirect to a page as this is an API route
        if (request.method === "POST" && internalRequest.action === "session") return Response.json(null, {
            status: 400
        });
        const isClientSafeErrorType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isClientError"])(error);
        const type = isClientSafeErrorType ? error.type : "Configuration";
        const params = new URLSearchParams({
            error: type
        });
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CredentialsSignin"]) params.set("code", error.code);
        const pageKind = isAuthError && error.kind || "error";
        var _config_pages_pageKind;
        const pagePath = (_config_pages_pageKind = (_config_pages = config.pages) === null || _config_pages === void 0 ? void 0 : _config_pages[pageKind]) !== null && _config_pages_pageKind !== void 0 ? _config_pages_pageKind : "".concat(config.basePath, "/").concat(pageKind.toLowerCase());
        const url = "".concat(internalRequest.url.origin).concat(pagePath, "?").concat(params);
        if (isRedirect) return Response.json({
            url
        });
        return Response.redirect(url);
    }
}
}),
"[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/providers/credentials.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * The Credentials provider allows you to handle signing in with arbitrary credentials,
 * such as a username and password, domain, or two factor authentication or hardware device (e.g. YubiKey U2F / FIDO).
 *
 * It is intended to support use cases where you have an existing system you need to authenticate users against.
 *
 * It comes with the constraint that users authenticated in this manner are not persisted in the database,
 * and consequently that the Credentials provider can only be used if JSON Web Tokens are enabled for sessions.
 *
 * :::caution
 * The functionality provided for credentials-based authentication is intentionally limited to discourage the use of passwords due to the inherent security risks of the username-password model.
 *
 * OAuth providers spend significant amounts of money, time, and engineering effort to build:
 *
 * - abuse detection (bot-protection, rate-limiting)
 * - password management (password reset, credential stuffing, rotation)
 * - data security (encryption/salting, strength validation)
 *
 * and much more for authentication solutions. It is likely that your application would benefit from leveraging these battle-tested solutions rather than try to rebuild them from scratch.
 *
 * If you'd still like to build password-based authentication for your application despite these risks, Auth.js gives you full control to do so.
 *
 * :::
 *
 * See the [callbacks documentation](/reference/core#authconfig#callbacks) for more information on how to interact with the token. For example, you can add additional information to the token by returning an object from the `jwt()` callback:
 *
 * ```ts
 * callbacks: {
 *   async jwt({ token, user, account, profile, isNewUser }) {
 *     if (user) {
 *       token.id = user.id
 *     }
 *     return token
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * import { Auth } from "@auth/core"
 * import Credentials from "@auth/core/providers/credentials"
 *
 * const request = new Request("https://example.com")
 * const response = await AuthHandler(request, {
 *   providers: [
 *     Credentials({
 *       credentials: {
 *         username: { label: "Username" },
 *         password: {  label: "Password", type: "password" }
 *       },
 *       async authorize({ request }) {
 *         const response = await fetch(request)
 *         if(!response.ok) return null
 *         return await response.json() ?? null
 *       }
 *     })
 *   ],
 *   secret: "...",
 *   trustHost: true,
 * })
 * ```
 * @see [Username/Password Example](https://authjs.dev/getting-started/authentication/credentials)
 */ __turbopack_context__.s([
    "default",
    ()=>Credentials
]);
function Credentials(config) {
    return {
        id: "credentials",
        name: "Credentials",
        type: "credentials",
        credentials: {},
        authorize: ()=>null,
        // @ts-expect-error
        options: config
    };
}
}),
]);

//# sourceMappingURL=75aed_%40auth_core_573fb3f4._.js.map