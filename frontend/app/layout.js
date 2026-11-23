import './globals.css';
import { Figtree } from 'next/font/google';
const font = Figtree({ subsets: ['latin'], variable: '--font-body' });
export const metadata = { title: 'Aria Chat', description: 'AI chatbot with real-time replies' };
export default function RootLayout({ children }) {
  return <html lang="en"><body className={`${font.variable} font-sans`}>{children}</body></html>;
}
