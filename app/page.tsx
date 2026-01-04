"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#F9FAFB]">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-[#111827] mb-3">Soccer Hub</h1>
          <p className="text-lg text-[#6B7280]">
            Full club management platform
          </p>
        </div>
        
        <SignedOut>
          <div className="flex flex-col gap-4">
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="outline" className="w-full">Sign Up</Button>
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton />
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
