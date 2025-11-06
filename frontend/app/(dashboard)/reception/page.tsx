import { getSession } from "@/helpers/actions/getsession"


export default async function page() {
    const session = await getSession()
    const user = session?.user.first_name
    return (
        <div>Welcome {user} </div>
    )
}
