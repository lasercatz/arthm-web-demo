// app/layout.tsx (or layout.tsx)
import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans } from "next/font/google";
import ThemeProvider from "@/styling/ThemeProvider";

const notoSans = Noto_Sans({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arthm",
  description: "Your AI drawing companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded"
          rel="stylesheet"
        />
        <link rel="icon" href="/logos/arthm-logo.svg" />
      </head>
      <body>
        {/* Pass the simple fontFamily string into the client ThemeProvider */}
        <ThemeProvider fontFamily={notoSans.style.fontFamily}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
