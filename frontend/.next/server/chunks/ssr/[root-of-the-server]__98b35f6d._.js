module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/fuctions/api/client.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//schema
__turbopack_context__.s([
    "client",
    ()=>client
]);
const client = {
    // login
    async Login (email, password) {
        console.log("Email client", email);
        console.log("Password", password);
        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:8000/api/v1")}/users/login`, {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=password&username=${email}&password=${password}&scope=&client_id=string&client_secret=********`,
            credentials: "include"
        });
        return response;
    },
    // get user
    async GetUser (token) {
        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:8000/api/v1")}/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    },
    // refresh token
    async refreshAccessToken () {
        try {
            const res = await fetch(`${("TURBOPACK compile-time value", "http://localhost:8000/api/v1")}/users/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                // If your API already reads refresh_token from cookie, body may not be required
                // body: JSON.stringify({ refresh_token: token.refresh_token }),
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to refresh token");
            const refreshed = await res.json();
            console.log("shhhhhhhhhhhhhhhhhhhh", refreshed);
            return {
                access_token: refreshed.access_token,
                expires_at: Math.floor(Date.now() / 1000 + refreshed.expires_in)
            };
        } catch (err) {
            console.error("Error refreshing token:", err);
            return {
                error: "RefreshAccessTokenError"
            };
        }
    },
    // resetPassword
    async resetPassword (email) {
        console.log("|Email: reset", email);
        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:8000/api/v1")}/users/request-password-reset`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json"
            },
            body: JSON.stringify({
                email
            })
        });
        // 🚨 Also: Check if response is OK before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        // return await response.json();
        }
        return await response.json();
    },
    // change password
    async changePassword (current_password, new_password, token) {
        try {
            const res = await fetch(`${("TURBOPACK compile-time value", "http://localhost:8000/api/v1")}/users/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password,
                    new_password
                })
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("whateeeeeeeeeeee");
                throw new Error(data.detail || "Failed to change password");
            }
            return data;
        } catch (error) {
            console.error("error password change", error);
            throw error; // let caller handle
        }
    },
    // create user admin
    async createUser (data) {
        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:8000/api/v1")}/admin/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json"
            },
            body: JSON.stringify({
                data
            })
        });
    }
};
}),
"[project]/auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InvalidLoginError",
    ()=>InvalidLoginError,
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$29_nex_f99e20e4a2bd4718e07082f16c8f675b$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.29_nex_f99e20e4a2bd4718e07082f16c8f675b/node_modules/next-auth/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$29_nex_f99e20e4a2bd4718e07082f16c8f675b$2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.29_nex_f99e20e4a2bd4718e07082f16c8f675b/node_modules/next-auth/providers/credentials.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/providers/credentials.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/fuctions/api/client.ts [app-rsc] (ecmascript)");
;
;
;
class InvalidLoginError extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CredentialsSignin"] {
    constructor(message){
        super(message);
        this.message = message;
    }
}
const { handlers, signIn, signOut, auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$29_nex_f99e20e4a2bd4718e07082f16c8f675b$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])({
            async authorize (credentials) {
                const { email, password } = credentials;
                try {
                    // Login → returns tokens
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["client"].Login(email, password);
                    const data = await response.json();
                    if (!response.ok) {
                        console.log("Auuuht", data);
                    }
                    if (!response.ok) throw new InvalidLoginError(data.detail);
                    // Fetch user profile with access_token
                    const userRes = await __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["client"].GetUser(data.access_token);
                    const user = await userRes.json();
                    console.log("User", user);
                    return {
                        ...user,
                        access_token: data.access_token,
                        expires_at: Math.floor(Date.now() / 1000 + data.expires_in)
                    };
                } catch (error) {
                    throw new InvalidLoginError(error.message);
                }
            }
        })
    ],
    callbacks: {
        // Runs whenever token is created/updated
        async jwt ({ token, user }) {
            // Initial login → attach tokens + user info
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    roles: user.roles,
                    is_active: user.is_active,
                    is_verified: user.is_verified,
                    permissions: user.permissions,
                    access_token: user.access_token,
                    expires_at: user.expires_at
                };
            }
            // If token still valid → return it
            if (Date.now() < token.expires_at * 1000) {
                return token;
            }
            // signOut();
            // Otherwise refresh
            const refreshed = await __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["client"].refreshAccessToken();
            if (refreshed.error) {
                return {
                    ...token,
                    error: "RefreshAccessTokenError"
                };
            }
            return {
                ...token,
                access_token: refreshed.access_token,
                expires_at: refreshed.expires_at
            };
        },
        // What's sent to the client (session)
        async session ({ session, token }) {
            session.user = {
                id: token.id,
                email: token.email,
                emailVerified: token.is_verified ? new Date() : null,
                first_name: token.firstName,
                last_name: token.lastName,
                is_active: token.is_active,
                is_verified: token.is_verified,
                roles: token.roles,
                permissions: token.permissions,
                access_token: token.access_token,
                expires_at: token.expires_at
            };
            session.access_token = token.access_token;
            session.error = token.error;
            return session;
        }
    },
    pages: {
        signIn: "/signin"
    }
});
}),
"[project]/fuctions/services/action.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"6034975c8e7fcb1eee48b6db461cfb9fdcd3358d60":"authenticate"},"",""] */ __turbopack_context__.s([
    "authenticate",
    ()=>authenticate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.2_@babel+core@7.2_0c38436d94fd4d44dcc71f4143339bd9/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.2_@babel+core@7.2_0c38436d94fd4d44dcc71f4143339bd9/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function authenticate(email, password) {
    try {
        const r = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signIn"])("credentials", {
            email,
            password,
            redirect: false
        });
        return {
            message: "success"
        }; // success case
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["InvalidLoginError"]) {
            // unwrap and return only the message
            return {
                error: error.message
            };
        }
        console.error("Unexpected error", error);
        return {
            error: "Something went wrong. Please try again."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    authenticate
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(authenticate, "6034975c8e7fcb1eee48b6db461cfb9fdcd3358d60", null);
}),
"[project]/.next-internal/server/app/(auth)/Signin/page/actions.js { ACTIONS_MODULE0 => \"[project]/fuctions/services/action.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$services$2f$action$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/fuctions/services/action.ts [app-rsc] (ecmascript)");
;
}),
"[project]/.next-internal/server/app/(auth)/Signin/page/actions.js { ACTIONS_MODULE0 => \"[project]/fuctions/services/action.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "6034975c8e7fcb1eee48b6db461cfb9fdcd3358d60",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$services$2f$action$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["authenticate"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$auth$292f$Signin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$fuctions$2f$services$2f$action$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(auth)/Signin/page/actions.js { ACTIONS_MODULE0 => "[project]/fuctions/services/action.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$services$2f$action$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/fuctions/services/action.ts [app-rsc] (ecmascript)");
}),
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/(auth)/Signin/page.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.2_@babel+core@7.2_0c38436d94fd4d44dcc71f4143339bd9/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/app/(auth)/Signin/page.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/(auth)/Signin/page.tsx <module evaluation>", "default");
}),
"[project]/app/(auth)/Signin/page.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.2_@babel+core@7.2_0c38436d94fd4d44dcc71f4143339bd9/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/app/(auth)/Signin/page.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/(auth)/Signin/page.tsx", "default");
}),
"[project]/app/(auth)/Signin/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$auth$292f$Signin$2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/app/(auth)/Signin/page.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$auth$292f$Signin$2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/app/(auth)/Signin/page.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$auth$292f$Signin$2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/app/(auth)/Signin/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(auth)/Signin/page.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__98b35f6d._.js.map