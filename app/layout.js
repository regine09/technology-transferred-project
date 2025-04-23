import "./globals.css";

export const metadata = {
  title: "Technology Transferred Project",
  description: "Monitoring and controlling system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-geist"
        data-new-gr-c-s-check-loaded="14.1101.0"
        data-gr-ext-installed=""

      >
        {children}
      </body>
    </html>
  );
}
