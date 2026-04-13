import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GiggiFi",
  description: "Where real talent meets real opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="ambient-underlay fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
