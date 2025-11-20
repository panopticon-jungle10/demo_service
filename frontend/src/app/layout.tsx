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
      <body className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold">LogQ</h1>
                <div className="hidden md:flex space-x-6 text-sm">
                  <a href="/" className="hover:text-gray-600">HOME</a>
                  <a href="/" className="hover:text-gray-600">COMMUNITY</a>
                  <a href="/" className="hover:text-gray-600">ABOUT</a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/admin" className="text-sm hover:text-gray-600">ADMIN</a>
              </div>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
