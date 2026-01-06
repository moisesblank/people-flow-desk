import React from "react";

type Props = {
  name: string;
  children: React.ReactNode;
};

/**
 * ErrorBoundary minimalista para P0 (fail-open):
 * se qualquer child crashar, renderiza children mesmo assim.
 */
export class FailOpenBoundary extends React.Component<
  Props,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // P0: sempre logar, nunca bloquear render.
    // eslint-disable-next-line no-console
    console.error(`[${this.props.name}] Erro capturado (ErrorBoundary):`, error);
  }

  render() {
    if (this.state.hasError) return <>{this.props.children}</>;
    return <>{this.props.children}</>;
  }
}

export default FailOpenBoundary;
