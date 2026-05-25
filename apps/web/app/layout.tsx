import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenStoreShot",
  description: "Local-agent OSS store screenshot studio"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
