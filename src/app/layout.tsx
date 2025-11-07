import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans } from "next/font/google";
const notoSans = Noto_Sans({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
})

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
        <link rel="icon" href= "/logos/arthm-logo.svg"/>
      </head>
      <body style={{ fontFamily: notoSans.style.fontFamily }}>
        {children}
      </body>
    </html>
  );
}
