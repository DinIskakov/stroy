import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});
const brand = Cormorant_Garamond({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
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
    <html
      lang="en"
      className={`${sans.variable} ${brand.variable} ${display.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
