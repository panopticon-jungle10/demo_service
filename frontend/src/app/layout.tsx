import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '로그 수집 서비스 Q&A',
  description: '로그 수집 서비스에 대한 질문과 답변',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
