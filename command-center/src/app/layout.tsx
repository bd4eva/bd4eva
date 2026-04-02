import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BD Command Center",
  description: "Personal command center for BD",
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
