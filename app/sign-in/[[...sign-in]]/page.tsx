import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
        },
      }}
      routing="path"
      path="/sign-in"
    />
  );
}

