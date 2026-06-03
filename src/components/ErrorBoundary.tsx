import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-10 w-10" />
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 mb-2">
                            Oups, une erreur est survenue !
                        </h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Une erreur inattendue est survenue dans l'application. Veuillez réessayer.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <summary className="cursor-pointer font-bold text-sm text-gray-700 mb-2">
                                    Détails de l'erreur (développeurs)
                                </summary>
                                <pre className="text-xs text-red-600 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                            >
                                <RefreshCw className="h-5 w-5" />
                                Réessayer
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                            >
                                <Home className="h-5 w-5" />
                                Accueil
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
