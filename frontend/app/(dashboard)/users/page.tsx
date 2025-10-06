import { Button } from "@/components/ui/button";
import { ArrowBigLeftDash, ArrowBigRight, BugIcon, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserForm from "./_components/userForm";
import { auth } from "@/auth";
import UsersTableClient from "./_components/UsersTableClient";

export default async function Users() {
  const session = await auth();
  const token = session?.access_token;

  return (
    <>
      <section className="mx-6 mt-8 flex justify-between items-center">
        <div className="">
          <h1 className="font-bold text-2xl">Users</h1>
          <p className="text-brand-gray text-lg leading-5 w-full max-w-[247px]">
            Manage user accounts and permissions
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="py-3  px-6 flex items-center shadow-gren text-lg font-bold rounded-[4px] bg-gradient-to-r from-[#24C453] to-[#24C453]">
              {" "}
              <Plus className={`w-7 h-7 text-brand-primary`} />
              <span className="text-lg font-bold ml-2 text-brand-primary">
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
      </section>
      <section className="mx-6 mt-6 ">
        <UsersTableClient token={token} />
      </section>
    </>
  );
}
