// ============================================
// MOISÉS MEDEIROS v10.0 - STRIPE INTEGRATION
// FASE 10: Integração Stripe
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/utils";
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Settings,
  ExternalLink,
  Shield,
  Zap,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface StripeIntegrationProps {
  isConnected?: boolean;
  onConnect?: () => void;
  stats?: {
    totalRevenue: number;
    thisMonth: number;
    transactions: number;
    successRate: number;
  };
}

export function StripeIntegration({ 
  isConnected = false, 
  onConnect,
  stats 
}: StripeIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (onConnect) {
        await onConnect();
      } else {
        // Default behavior - show toast
        toast.info("Configuração Stripe", {
          description: "Configure sua chave API Stripe nas configurações do projeto.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // formatCurrency importado de @/utils

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 rounded-full bg-[#635BFF]/10 w-fit mb-4">
            <CreditCard className="h-8 w-8 text-[#635BFF]" />
          </div>
          <CardTitle>Conectar Stripe</CardTitle>
          <CardDescription>
            Aceite pagamentos com cartão de crédito, débito, PIX e muito mais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-[#635BFF]" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-[#635BFF]" />
              <span>Checkout rápido</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-[#635BFF]" />
              <span>Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-[#635BFF]" />
              <span>Multi-moeda</span>
            </div>
          </div>

          <Button 
            className="w-full bg-[#635BFF] hover:bg-[#5046E4]"
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Conectar Stripe
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#635BFF]/30 bg-gradient-to-br from-[#635BFF]/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#635BFF]/20">
              <CreditCard className="h-5 w-5 text-[#635BFF]" />
            </div>
            <div>
              <CardTitle className="text-lg">Stripe</CardTitle>
              <CardDescription>Pagamentos Online</CardDescription>
            </div>
          </div>
          <Badge className="bg-[hsl(var(--stats-green))] text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <>
            {/* Revenue stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Este Mês</p>
                <p className="text-lg font-bold text-[#635BFF]">
                  {formatCurrency(stats.thisMonth)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>

            {/* Success rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Sucesso</span>
                <span className="font-medium">{stats.successRate}%</span>
              </div>
              <Progress value={stats.successRate} className="h-2" />
            </div>

            {/* Transactions count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transações</span>
              <span className="font-medium">{stats.transactions}</span>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Stripe payment button component
export function StripePayButton({ 
  amount, 
  productName,
  onSuccess,
  onError,
  className = "" 
}: { 
  amount: number;
  productName: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // This would typically call your edge function to create a checkout session
      toast.info("Iniciando pagamento...", {
        description: `Produto: ${productName} - ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount / 100)}`,
      });
      
      // Simulate redirect
      setTimeout(() => {
        onSuccess?.();
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      onError?.(error as Error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className={`bg-[#635BFF] hover:bg-[#5046E4] ${className}`}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4 mr-2" />
      )}
      Pagar com Stripe
    </Button>
  );
}
