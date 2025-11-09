import React from 'react'
import NotificationClient from './_components/notificationClient'
import { getSession } from '@/helpers/actions/getsession'
import { AppointmentDashboard } from './_components/AppointmentDashboard'

export default async function Notification() {
  const session = await getSession()
  const officeId = session?.user.office_id
   return (
    <div className="space-y-6 p-6">
      {/* Compact notification panel */}
      <div className="max-w-md">
        <NotificationClient office_id={officeId} />
      </div>
      
      {/* Full dashboard */}
      <AppointmentDashboard officeId={officeId} />
    </div>
  );
}

