module.exports = [
"[project]/.next-internal/server/app/api/auth/[...nextauth]/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/fuctions/api/client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$29_nex_f99e20e4a2bd4718e07082f16c8f675b$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.29_nex_f99e20e4a2bd4718e07082f16c8f675b/node_modules/next-auth/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/errors.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$29_nex_f99e20e4a2bd4718e07082f16c8f675b$2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.29_nex_f99e20e4a2bd4718e07082f16c8f675b/node_modules/next-auth/providers/credentials.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.40.0/node_modules/@auth/core/providers/credentials.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/fuctions/api/client.ts [app-route] (ecmascript)");
;
;
;
class InvalidLoginError extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$errors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsSignin"] {
    constructor(message){
        super(message);
        this.message = message;
    }
}
const { handlers, signIn, signOut, auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$29_nex_f99e20e4a2bd4718e07082f16c8f675b$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$40$2e$0$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            async authorize (credentials) {
                const { email, password } = credentials;
                try {
                    // Login → returns tokens
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["client"].Login(email, password);
                    const data = await response.json();
                    if (!response.ok) {
                        console.log("Auuuht", data);
                    }
                    if (!response.ok) throw new InvalidLoginError(data.detail);
                    // Fetch user profile with access_token
                    const userRes = await __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["client"].GetUser(data.access_token);
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
            const refreshed = await __TURBOPACK__imported__module__$5b$project$5d2f$fuctions$2f$api$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["client"].refreshAccessToken();
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
"[project]/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/auth.ts [app-route] (ecmascript)");
;
const { GET, POST } = __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handlers"];
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__57aa9d31._.js.map