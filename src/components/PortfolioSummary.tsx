import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Settings, DollarSign, Euro, Banknote } from 'lucide-react';
import FinancialDashboard from './FinancialDashboard';

interface WeeklyData {
  id: string;
  date: string;
  rates: {
    usdToBrl: number;
    eurToBrl: number;
    btcToUsd: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    usd: number;
    brl: number;
    eur: number;
  }>;
  totalUsd: number;
  totalBrl: number;
  totalEur: number;
}

export const PortfolioSummary = () => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [latestWeek, setLatestWeek] = useState<WeeklyData | null>(null);
  const [previousWeek, setPreviousWeek] = useState<WeeklyData | null>(null);

  useEffect(() => {
    const savedWeeks = localStorage.getItem('financialWeeks');
    if (savedWeeks) {
      const weeks: WeeklyData[] = JSON.parse(savedWeeks);
      if (weeks.length > 0) {
        const sorted = weeks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLatestWeek(sorted[0]);
        if (sorted.length > 1) {
          setPreviousWeek(sorted[1]);
        }
      }
    }
  }, []);

  if (showDetailed) {
    return <FinancialDashboard onBack={() => setShowDetailed(false)} />;
  }

  if (!latestWeek) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-primary mb-4">Portfolio Overview</h1>
            <p className="text-muted-foreground mb-8">No data available yet. Start by managing your portfolio.</p>
            <Button onClick={() => setShowDetailed(true)} className="gap-2">
              <Settings className="h-4 w-4" />
              Manage Portfolio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getTotalPortfolioInBrl = () => {
    return latestWeek.totalBrl + 
           (latestWeek.totalUsd * latestWeek.rates.usdToBrl) + 
           (latestWeek.totalEur * latestWeek.rates.eurToBrl);
  };

  const currentTotal = getTotalPortfolioInBrl();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Portfolio Overview</h1>
            <p className="text-muted-foreground">
              {new Date(latestWeek.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button onClick={() => setShowDetailed(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Portfolio
          </Button>
        </div>

        {/* Total Portfolio */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg text-muted-foreground mb-2">Total Portfolio</h2>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(currentTotal, 'BRL')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                USD Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold">{formatCurrency(latestWeek.totalUsd, 'USD')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                BRL Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold">{formatCurrency(latestWeek.totalBrl, 'BRL')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Euro className="h-4 w-4" />
                EUR Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold">{formatCurrency(latestWeek.totalEur, 'EUR')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Current Exchange Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">USD → BRL</div>
                <div className="text-lg font-bold">{latestWeek.rates.usdToBrl.toFixed(4)}</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">EUR → BRL</div>
                <div className="text-lg font-bold">{latestWeek.rates.eurToBrl.toFixed(4)}</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">BTC → USD</div>
                <div className="text-lg font-bold">{formatCurrency(latestWeek.rates.btcToUsd, 'USD')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};