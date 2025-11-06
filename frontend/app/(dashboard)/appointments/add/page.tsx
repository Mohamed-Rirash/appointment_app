


import { client } from '@/helpers/api/client'
import AddForm from './_components/addForm'
import { getSession } from '@/helpers/actions/getsession'
import { redirect } from 'next/navigation';

export default async function AddAppointment() {
    const session = await getSession()
    const token = session?.user.access_token
    const officeId = session?.user.office_id
    const hostId = session?.user.id
    const hostName = session?.user.first_name + " " + session?.user.last_name
    const role = session?.user.roles[0]



    if (role && role !== "reception" && role !== "host") {
        redirect("/");
        return null
    }

    if (!token) {
        return <div>Loading...</div>
    }


    return (
        <main className='my-8'>
            {role === "host" && <AddForm office_id={officeId} token={token} host_id={hostId} hostName={hostName} role={role} />}
            <div className="">
                reception form is comming?...
            </div>
        </main>
    )
}
