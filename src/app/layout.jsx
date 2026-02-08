import "./globals.css";
import AppThemeProvider from "./AppThemeProvider";

export const metadata = {
  title: "Secure Assessment Environment",
  description: "Chrome-only secure test environment demo"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
