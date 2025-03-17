// pages/SignInPage.jsx
import { SignIn } from '@clerk/clerk-react';

function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}

export default SignInPage;