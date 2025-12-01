import type { Metadata } from "next";
import AntdProvider from "@/components/AntdProvider";
import "./globals.css";
import 'antd/dist/reset.css';

export const metadata: Metadata = {
  title: "Support Ticket Manager",
  description: "Manage support tickets with background jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AntdProvider>
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
