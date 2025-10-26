import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import CreateOfficeForm from "./_components/officeForm";
import OfficeTable from "./_components/OfficeTable";
import { getSession } from "@/helpers/actions/getsession";

export default async function Offices() {
  const session = await getSession()
  const token = session?.user.access_token;

  return (
    <>
      <main className="mx-8 mt-8">
        <section className="flex justify-between items-center">
          <div className="">
            <h1 className="font-bold text-2xl">Offices</h1>
            <p className="text-brand-gray text-lg leading-5 w-full max-w-[247px]">
              Manage offices
            </p>
          </div>
          <div className="">
            <Dialog>
              <DialogTrigger asChild>
                <button className="py-3  px-4 flex items-center combined-shadow text-lg font-bold rounded-[4px] bg-gradient-green">
                  {" "}
                  <Plus className={`w-7 h-7 text-brand-primary`} />
                  <span className="text-lg font-bold ml-2 text-brand-primary">
                    {" "}
                    Create Offece
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="p-6 max-w-[368px] w-full">
                <DialogTitle className="text-lg mb-0 font-bold text-center text-brand-black">
                  Create New Office
                </DialogTitle>

                <DialogDescription className="text-[14px] max-w-[320px] w-full mx-auto text-center leading-[16px] text-brand-gray">
                  Add the office’s name, description, and location to register
                  it in the system
                </DialogDescription>
                <CreateOfficeForm token={token} />
              </DialogContent>
            </Dialog>
          </div>
        </section>
        <section className="mt-8">
        <OfficeTable token={token}/>
        </section>
      </main>
    </>
  );
}
