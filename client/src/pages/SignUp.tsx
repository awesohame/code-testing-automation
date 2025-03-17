// pages/SignUpPage.jsx
import { SignUp } from '@clerk/clerk-react';

function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}

export default SignUpPage;