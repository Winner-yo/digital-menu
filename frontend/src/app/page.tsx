import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-brand shadow-food-card flex items-center justify-center mb-8 animate-bounce-soft">
          <span className="text-5xl">🍽️</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 font-display">
          Ethiopian{' '}
          <span className="gradient-text">Digital Menu</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-md leading-relaxed">
          Modern food ordering platform for Ethiopian restaurants. Browse, order, and pay with Telebirr or CBE Birr.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-sm">
          <Link
            href="/menu/habesha-restaurant"
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-2xl text-center transition-all shadow-food-card hover:shadow-lg hover:-translate-y-0.5"
          >
            View Demo Menu
          </Link>
          <Link
            href="/login"
            className="flex-1 border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-4 px-6 rounded-2xl text-center transition-all"
          >
            Restaurant Login
          </Link>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 pb-12 max-w-4xl mx-auto w-full">
        {[
          { icon: '📱', title: 'QR Menu', desc: 'Scan & browse instantly' },
          { icon: '💳', title: 'Telebirr Pay', desc: 'Ethiopian payments' },
          { icon: '📊', title: 'Dashboard', desc: 'Real-time analytics' },
          { icon: '🚚', title: 'Delivery', desc: 'Track your order' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-4 shadow-card text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
