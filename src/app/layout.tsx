import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NOVA",
  description: "NOVA AI Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
