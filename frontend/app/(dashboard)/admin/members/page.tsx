import {  Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserForm from "./_components/userForm";
import UsersTableClient from "./_components/UsersTableClient";
import { getSession } from "@/helpers/actions/getsession";
// import UsersStatsCard from "./_components/UsersStatsCard";

export default async function Members() {
  const session = await getSession()
  const token = session?.user.access_token;

  return (
    <>
      <main className="mx-6 mt-8 ">
        <section className="flex justify-between items-center">
          <div className="">
            <h1 className="font-bold text-2xl">Users</h1>
            <p className="text-brand-gray text-lg leading-5 w-full max-w-[247px]">
              Manage user accounts and permissions
            </p>
          </div>

          <div className="">
            <Dialog>
              <DialogTrigger asChild>
                <button className="py-3  px-4 flex items-center shadow-gren text-lg font-bold rounded-[4px] bg-gradient-green">
                  {" "}
                  <Plus className={`w-7 h-7 text-brand-primary`} />
                  <span className="text-lg  font-bold ml-2 text-brand-primary">
                    {" "}
                    Create User
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="p-6 max-w-md w-full">
                <DialogTitle className="text-2xl font-bold text-center">
                  Create new user
                </DialogTitle>
                <DialogDescription></DialogDescription>
                <UserForm token={token} />
              </DialogContent>
            </Dialog>
          </div>
        </section>
        {/* <section className="mx-6 my-8">
        <UsersStatsCard />
      </section> */}
        <section className="mx-6 mt-8 ">
          <UsersTableClient token={token} />
        </section>
      </main>
    </>
  );
}
