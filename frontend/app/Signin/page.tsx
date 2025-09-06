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
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import { signIn } from "next-auth/react";
import { useState } from "react";
import { authenticate } from "@/lib/services/action";

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

  async function Submit(values: z.infer<typeof formSchema>) {
    // 1. Clear previous errors
    form.clearErrors();
    setLoading(true);
    console.log(values);
    const result = await authenticate(values.email, values.password);
    console.log("Result", result);
    console.log("shit", result.error);
    setLoading(false);
    // 3. Handle authentication response
    let errorMessage;
    if (result?.error) {
      errorMessage = result.error;

      // 4. Set error on password field (common practice for login forms)
      form.setError("password", {
        type: "manual",
        message: errorMessage,
      });
      form.setError("email", {
        type: "manual",
        message: errorMessage,
      });
    }
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className=" border border-[#e1e1e1] p-8 rounded-sm">
        <h1 className="text-[#2c2c2c] text-5xl font-bold mb-2">Get Started</h1>
        <p>provide your username/email and password to use the system</p>
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
                      className="py-6 pl-4 text-lg mb-0"
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
                      className="py-6 pl-4 text-lg"
                      type="password"
                      placeholder="*********"
                      {...field}
                    />
                  </FormControl>
                  <p className="bg-amber-500"> Forget Password?</p>
                  <FormMessage className="py-2 text-lg" />
                </FormItem>
              )}
            />
            <Button
              disabled={loading}
              type="submit"
              className={`py-6 w-full text-lg mt-8 ${
                loading ? "opacity-50 pointer-disabled" : ""
              }`}
            >
              {loading ? "Sign in ..." : "Sign in"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
