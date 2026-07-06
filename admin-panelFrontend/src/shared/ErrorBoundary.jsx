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
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow">
            <h1 className="mb-2 text-lg font-black text-gray-900">حدث خطأ غير متوقع</h1>
            <p className="mb-4 text-sm text-gray-600">
              {this.props.fallbackMessage || 'تعذّر عرض لوحة التحكم. جرّب تحديث الصفحة أو تسجيل الدخول مجدداً.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.assign(this.props.homePath || '/login')}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
