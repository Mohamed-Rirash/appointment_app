"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import logo from "@/public/logo.png";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import axios from "axios";

// define the form schema
const formSchema = z.object({
  email: z.email({ message: "Invalid email" }),
  password: z.string().min(8),
});
export default function Signin() {
  console.log("Hello guys");
  const [loading, setLoading] = useState(false);

  // define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  interface LoginResponse {
  message?: string;
  error?: string;
  user?: any;
  token?: string;
}
async function Submit(values: z.infer<typeof formSchema>) {
  form.clearErrors();
  setLoading(true);
  
  try {
    const { data } = await axios.post<LoginResponse>(
      "http://localhost:80/api/auth/login", 
      values
    );
    
    console.log("Response data:", data);
    
    if (data.message === "success") {
      router.push("/");
    } else if (data.error) {
      // Set error on both email and password fields
      form.setError("password", {
        type: "manual",
        message: data.error,
      });
      form.setError("email", {
        type: "manual", 
        message: data.error,
      });
    }
    
  } catch (error: any) {
    console.error("Login error:", error);
    
    let errorMessage = "Login failed. Please try again.";
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message;
    }
    
    // Set error on both email and password fields
    form.setError("password", {
      type: "manual",
      message: errorMessage,
    });
    form.setError("email", {
      type: "manual",
      message: errorMessage,
    });
    
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="flex justify-center items-center h-screen">
      <div className=" w-full max-w-[468px] sm:border border-[#e1e1e1] p-4 sm:p-8 rounded-[8px]">
        <div className="flex flex-col  justify-center items-center">
          <Image src={logo} width={258} height={32} alt="logo" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(Submit)} className="mt-6">
            {/* email  */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-bold text-[#2c2c2c] ">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="py-7 pl-4 text-lg mb-0"
                      type="email"
                      placeholder="example@gmail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className=" py-2 text-lg " />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-lg text-semibold text-[#2c2c2c] ">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="py-7 pl-4 text-lg "
                      type="password"
                      placeholder="*********"
                      {...field}
                    />
                  </FormControl>
                  <Link
                    href={"/forget-password"}
                    className=" font-semibold underline cursor-pointer py-5 text-right text-[#2c2c2c]"
                  >
                    {" "}
                    Forget Password?
                  </Link>
                  <FormMessage className="py-2 text-lg" />
                </FormItem>
              )}
            />
            <Button
              disabled={loading}
              type="submit"
              className={`py-[28px] w-full  text-xl font-bold mt-4 bg-linear-to-r from-[#21D256] to-[#0EA73C] ${
                loading ? "opacity-50 pointer-disabled" : ""
              }`}
            >
              {loading ? (
                <>
                  Login in ... <Spinner className="ml-2 h-4 w-4 text-white" />
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
