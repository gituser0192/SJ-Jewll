import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sheochand Jewellery | Since 1964",
  description: "Three generations of independent craftsmanship. Explore the collection and arrange your personal consultation.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

