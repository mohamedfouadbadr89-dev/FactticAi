import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facttic.AI | Enterprise Deterministic Engine",
  description: "Production-ready governance platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}