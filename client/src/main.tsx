import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ClerkProvider } from '@clerk/clerk-react'
import { UserProvider } from '@/context/UserContext';

// console.log(import.meta.env); 
// console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// console.log(PUBLISHABLE_KEY);

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <BrowserRouter>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <UserProvider>
        <App />
      </UserProvider>
    </ClerkProvider>
  </BrowserRouter>
);
