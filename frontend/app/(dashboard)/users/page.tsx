import { Button } from "@/components/ui/button";
import { ArrowBigLeftDash, ArrowBigRight, BugIcon } from "lucide-react";

import arrow from "@/public/back_arrow.png";
import Image from "next/image";

export default function Users() {
  return (
    <>
      <h1>Hello world so what is new</h1>
      <div className="p-8">
        <Button
          className="text-xl py-6 rounded-[4px] 
        border border-e-bran-secondary bg-white text-brand-gray flex "
        >
          <Image
            className="ml-2"
            src={arrow}
            width={18}
            height={18}
            alt="arrow"
          />
          <span className="mx-2">Hello world</span>
        </Button>
        <Button disabled={true} className="bg-[#e1e1e1] text-brand-gray">
          Hello world
        </Button>
      </div>
    </>
  );
}
