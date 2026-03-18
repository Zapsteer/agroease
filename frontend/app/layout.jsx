import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "AgroEase — Himachal Pradesh Agri Platform",
  description: "Farmers ke liye — seeds, fertilizers, pesticides online marketplace with AI disease detection",
  manifest: "/manifest.json",
  themeColor: "#1B5E20",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <div className="app-container">
            {children}
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: "12px", background: "#1B5E20", color: "#fff", fontSize: "14px" },
              success: { style: { background: "#1B5E20" } },
              error:   { style: { background: "#c62828" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
