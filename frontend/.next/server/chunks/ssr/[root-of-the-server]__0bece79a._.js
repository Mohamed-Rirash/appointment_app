module.exports = [
"[project]/.next-internal/server/app/(dashboard)/profile/page/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/(dashboard)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(dashboard)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/fuctions/api/client.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

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
    // ✅ Corrected version
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
        }
        return await response.json();
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
            console.log("Usershit", user);
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    email: user.email,
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
                emailVerified: null,
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
"[project]/app/(dashboard)/profile/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Profile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.2_@babel+core@7.2_0c38436d94fd4d44dcc71f4143339bd9/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/auth.ts [app-rsc] (ecmascript)");
;
;
async function Profile() {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    console.log("User", user);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_$40$babel$2b$core$40$7$2e$2_0c38436d94fd4d44dcc71f4143339bd9$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "border border-[#eeeeee] ml-[122px] mt-[160px] p-6"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/profile/page.tsx",
            lineNumber: 8,
            columnNumber: 7
        }, this)
    }, void 0, false);
}
}),
"[project]/app/(dashboard)/profile/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/(dashboard)/profile/page.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0bece79a._.js.map