import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKP-CIDB Builder",
  description: "Competency mapping, module authoring and assessment platform for CIDB SKP development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
