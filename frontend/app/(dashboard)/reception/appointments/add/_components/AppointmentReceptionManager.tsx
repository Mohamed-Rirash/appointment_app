import AddReceptionform from "./AddReceptionform";


interface AppointmentRecepManagerProps {
  token?: string;
}

export default function AppointmentReceptionManager({
  token,
}: AppointmentRecepManagerProps) {


  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8 bg-red-">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-brand-black">
            Schedule Guest Visit
          </h2>
          <p className="text-brand-gray max-w-[400px] mx-auto">
            Enter guest details and schedule their appointment. All
            fields are required to ensure proper booking.
          </p>
        </div>
      </div>

      {/* Main Tabs Section */}
      <div className="">
        <AddReceptionform token={token} />
      </div>
    </div>
  );
}
