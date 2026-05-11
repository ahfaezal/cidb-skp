import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/lib/auth";

export const metadata: Metadata = {
  title: "SKP-CIDB Builder",
  description:
    "Competency mapping, module authoring and assessment platform for CIDB SKP development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
