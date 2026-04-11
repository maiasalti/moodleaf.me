import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { CookieBanner } from "@/components/cookie-banner";
import FeedbackButton from "@/components/FeedbackButton";
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <FeedbackButton />
          </AuthProvider>
        </ThemeProvider>
        <CookieBanner />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6W3W6XHVCW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6W3W6XHVCW');
          `}
        </Script>
      </body>
    </html>
  );
}
