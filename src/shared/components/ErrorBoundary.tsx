import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="nt-tile max-w-md text-center">
            <p className="nt-display text-2xl">Something went wrong</p>
            <p className="mt-2 text-sm text-muted-foreground">{this.state.message}</p>
            <button className="nt-btn-primary mt-5" onClick={() => window.location.reload()}>
              Reload the page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
