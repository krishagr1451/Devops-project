import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StayNGo – Premium Hotel Booking",
  description: "Find and book premium hotel rooms with StayNGo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(28,28,30,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f4f4f5",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
