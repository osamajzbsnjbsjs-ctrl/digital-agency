import './globals.css'
import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'

const cairo = Cairo({ subsets: ['arabic'] })

export const metadata: Metadata = {
  title: 'وكالة الخدمات الرقمية',
  description: 'نقدم أفضل الحلول البرمجية وتطوير الويب بتقنيات الذكاء الاصطناعي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-midnight text-gray-100 antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  )
}