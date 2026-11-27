import { Component, type ErrorInfo, type ReactNode } from "react";
import { trackClientError } from "@/features/tracking/tracker";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI error:", error, info.componentStack);
    trackClientError(error.message);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="text-2xl font-bold text-text">
          Rất tiếc, đã có lỗi xảy ra
        </h1>
        <p className="max-w-md text-sm text-text-secondary">
          Đã xảy ra lỗi hệ thống. Vui lòng tải lại trang hoặc thử lại sau.
        </p>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }
}
