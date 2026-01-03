import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      appearance={{
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
        },
      }}
      routing="path"
      path="/sign-up"
    />
  );
}

