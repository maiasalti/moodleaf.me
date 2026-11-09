import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Karla } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { CookieBanner } from "@/components/cookie-banner";
import FeedbackButton from "@/components/FeedbackButton";
import Vines from "@/components/Vines";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-body",
});

// Runs before first paint so a stored light-mode preference doesn't flash the default dark theme (or vice versa).
const themeScript = `try{var t=localStorage.getItem("moodleaf-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){}`;

export const metadata: Metadata = {
  title: "Moodleaf — Find your next favorite book",
  description:
    "Adjust sliders to match your reading mood, and discover the perfect books for you.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "256x256", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Moodleaf — Find your next favorite book",
    description:
      "Adjust sliders to match your reading mood, and discover the perfect books for you.",
    siteName: "Moodleaf",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moodleaf — Find your next favorite book",
    description: "Adjust sliders to match your reading mood, and discover the perfect books for you.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${cormorant.variable} ${karla.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="relative min-h-screen font-sans antialiased">
        <Vines />
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
