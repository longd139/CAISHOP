import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DE'GENT | Thời Trang Thiết Kế May Đo Cao Cấp",
  description: "DE'GENT — Tối giản, hiện đại và chuẩn mực may đo tinh tế",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
