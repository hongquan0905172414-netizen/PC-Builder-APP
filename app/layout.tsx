import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RIG",
  description: "A smart companion for building custom PCs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
