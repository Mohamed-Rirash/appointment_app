"use client"
import { useState } from "react";
import AddForm from "./addForm";
import AppointmentList from "./AppointmentList";


interface formData {
    hostId: string
    officeId: string
    token?: string

}

export default function AppointmentManager({ officeId, hostId, token }:formData) {
  const [activeTab, setActiveTab] = useState('book');

  return (
    <div>
      <div className="tab-buttons">
        <button onClick={() => setActiveTab('book')}>Book Appointment</button>
        <button onClick={() => setActiveTab('view')}>My Appointments</button>
      </div>
      <div className="tab-content">
        {activeTab === 'book' && <AddForm office_id={officeId} token={token} host_id={hostId} />}
        {activeTab === 'view' && <AppointmentList />}
      </div>
    </div>
  );
}