import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-4xl font-bold">Soccer Database</h1>
        <p className="text-lg text-gray-600">
          Full club management platform
        </p>
        
        <SignedOut>
          <div className="flex flex-col gap-4">
            <Link
              href="/sign-in"
              className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded border border-blue-600 px-6 py-3 text-blue-600 hover:bg-blue-50"
            >
              Sign Up
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton />
            <Link
              href="/dashboard"
              className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
