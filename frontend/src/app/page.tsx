export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          로그 수집 서비스 Q&A
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">질문하기</h2>
          <p className="text-gray-600">
            로그 수집 서비스에 대해 궁금한 점을 질문해주세요.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">최근 질문</h2>
          <p className="text-gray-500 text-center py-8">
            아직 질문이 없습니다.
          </p>
        </div>
      </div>
    </main>
  )
}
