import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanRoute",
  description: "Simple ops software for commercial cleaning companies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
