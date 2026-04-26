import './globals.css';

export const metadata = {
  title: 'Ocean Galerie · Artemis',
  description: 'Exklusive Kunst-Auktionen. Handgezeichnete Originalwerke direkt vom Künstler Artemis — Unikate aus Zürich.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
