import { Component, Fragment } from "react";
import { useLocation } from "react-router-dom";
import useLanguage from "../../localization/useLanguage";

function getFallbackLabels() {
  const english = typeof document !== "undefined" && document.documentElement.lang === "en";
  return english
    ? {
        title: "This section encountered an error",
        kicker: "Fallback mode",
        description: "The rest of the portfolio remains available. You can retry loading this section.",
        retry: "Retry",
      }
    : {
        title: "Cette section a rencontré une erreur",
        kicker: "Mode de secours",
        description: "Le reste du portfolio reste disponible. Tu peux réessayer le chargement de cette section.",
        retry: "Réessayer",
      };
}

function DefaultErrorFallback({ error, onRetry, title }) {
  const labels = getFallbackLabels();

  return (
    <section className="error-boundary-card" role="alert">
      <p className="error-boundary-kicker">{labels.kicker}</p>
      <h2>{title || labels.title}</h2>
      <p>{labels.description}</p>
      {import.meta.env.DEV && error?.message && (
        <code className="error-boundary-detail">{error.message}</code>
      )}
      <button type="button" className="error-boundary-retry" onClick={onRetry}>
        {labels.retry}
      </button>
    </section>
  );
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Portfolio UI boundary:", error, info);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => {
    this.setState((state) => ({ error: null, retryKey: state.retryKey + 1 }));
  };

  render() {
    const { error, retryKey } = this.state;
    if (!error) {
      if (this.props.wrapperClassName) {
        return (
          <div key={retryKey} className={this.props.wrapperClassName}>
            {this.props.children}
          </div>
        );
      }

      return <Fragment key={retryKey}>{this.props.children}</Fragment>;
    }

    if (typeof this.props.fallback === "function") {
      return this.props.fallback({ error, onRetry: this.handleRetry });
    }

    return (
      <DefaultErrorFallback
        error={error}
        onRetry={this.handleRetry}
        title={this.props.title}
      />
    );
  }
}

export function AppErrorBoundary({ children }) {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <ErrorBoundary
      resetKey={`${location.pathname}${location.search}`}
      title={t("error.appTitle")}
      wrapperClassName="app-error-boundary-root"
    >
      {children}
    </ErrorBoundary>
  );
}
