import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Map to Naver Map",
  description: "Convert Google Maps links to Naver Maps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
