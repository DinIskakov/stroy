import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
export const metadata: Metadata = {
  title: "stroy — A little more personal",
  description:
    "You know your people. stroy finds the gift. A thoughtful gift agent with live research, clear budgets, and your rules in mind.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
