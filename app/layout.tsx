import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'GET Maison Éternelle — A World Within A World', description: 'A cinematic journey into the world of Get Maison.' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
