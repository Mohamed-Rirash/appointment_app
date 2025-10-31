
import { ArrowLeft } from 'lucide-react'
import ManageAvailability from '../_components/ManageAvailability'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function page() {
    return (
        <>
            <main className='px-6 pt-8'>
                <div className="">
                    <Link href={"/host"}>
                        <Button
                            className="text-xl py-6 rounded-[4px] shodow-gren transition-colors
        border border-[#eeeeee] bg-white text-brand-gray hover:bg-brand-primary/40 "
                        >
                            <ArrowLeft className="h-5! w-5!" />
                            <span className="mx-2"> Back to login</span>
                        </Button>
                    </Link>
                </div>
                <section className='mt-8'>
                    <ManageAvailability officeId={"akdjfajdsfjasjdf"} />
                </section>
            </main>
        </>
    )
}
