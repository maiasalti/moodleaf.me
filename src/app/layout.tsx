import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moodleaf — Find your next favorite book",
  description:
    "Adjust sliders to match your reading mood, and discover the perfect books for you.",
  openGraph: {
    title: "Moodleaf — Find your next favorite book",
    description:
      "Adjust sliders to match your reading mood, and discover the perfect books for you.",
    siteName: "Moodleaf",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
