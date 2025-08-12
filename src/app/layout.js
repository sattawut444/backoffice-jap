import "./globals.css";
import LayoutContent from './components/LayoutContent';
import { AuthProvider } from './components/AuthProvider';
import { LanguageProvider } from './components/LanguageProvider';

export const metadata = {
  title: "HotelPro Management",
  description: "Hotel management system",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-gray-50">
        <AuthProvider>
          <LanguageProvider>
            <LayoutContent>{children}</LayoutContent>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
