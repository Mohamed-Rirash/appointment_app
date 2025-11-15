"use server"

import { getSession } from "./getsession"

export default async function getUser() {
    const session = await getSession()
    const user = session?.user
    return user
}