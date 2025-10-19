"use client"

import { client } from "@/helpers/api/client";
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react";
import toast from "react-hot-toast";


export function useActivateOffice(token?:string){
    const queryClient = useQueryClient();
    const [isActivating, setIsActivating] = useState(false)

    const activateOffice = async (officeId: string) => {
        if (!token) {
            toast.error("Unauthorized");
            return false;
          }

          try {
            setIsActivating(true)
            const success = await client.activateOffice(officeId, token)
            toast.success(success.message || "Office activated Successfully!")
            queryClient.invalidateQueries({queryKey:["offices"]})
             return true
          } catch (err: any) {
            toast.error(err.message || "Failed to activate office")
          } finally{
            setIsActivating(false)
          }
    }

    return { activateOffice, isActivating}

}