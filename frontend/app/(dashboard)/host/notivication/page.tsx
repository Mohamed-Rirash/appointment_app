import React from 'react'
import NotificationClient from './_components/notificationClient'
import { getSession } from '@/helpers/actions/getsession'

export default async function Notification() {
  const session = await getSession()
  const officeId = session?.user.office_id
  return (
    <>
    <h1>the notification system test</h1>
    <NotificationClient office_id={officeId} />
    </>
  )
}
