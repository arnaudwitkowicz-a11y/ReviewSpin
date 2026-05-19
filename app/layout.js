import "./globals.css";

export const metadata = {
  title: "ReviewSpin",
  description: "Share your experience and spin to win",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}