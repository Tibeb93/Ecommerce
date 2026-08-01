import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--red)" }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>{this.state.error?.message}</p>
          <button className="btn" style={{ marginTop: "1rem" }} onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
