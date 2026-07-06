import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-[#07070f] px-6 font-['Cairo'] text-white"
        >
          <div className="max-w-md rounded-3xl border border-red-500/25 bg-red-500/10 p-6 text-center">
            <h1 className="mb-2 text-lg font-black">حدث خطأ غير متوقع</h1>
            <p className="mb-4 text-sm font-bold text-white/70">
              {this.props.fallbackMessage || 'تعذّر عرض الصفحة. جرّب تحديث المتصفح أو العودة للرئيسية.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.assign(this.props.homePath || '/')}
              className="rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-gray-900"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
