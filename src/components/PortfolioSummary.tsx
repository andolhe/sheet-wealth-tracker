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
            <h1 className="text-3xl font-bold text-primary mb-4">Financial Portfolio</h1>
            <p className="text-muted-foreground mb-8">No data available yet. Start by adding your financial information.</p>
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

  const getPreviousTotalInBrl = () => {
    if (!previousWeek) return 0;
    return previousWeek.totalBrl + 
           (previousWeek.totalUsd * previousWeek.rates.usdToBrl) + 
           (previousWeek.totalEur * previousWeek.rates.eurToBrl);
  };

  const currentTotal = getTotalPortfolioInBrl();
  const previousTotal = getPreviousTotalInBrl();
  const variation = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Portfolio Summary</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date(latestWeek.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button onClick={() => setShowDetailed(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Portfolio
          </Button>
        </div>

        {/* Main Portfolio Value */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-lg text-muted-foreground mb-2">Total Portfolio Value</h2>
              <div className="text-4xl font-bold text-primary mb-4">
                {formatCurrency(currentTotal, 'BRL')}
              </div>
              {previousWeek && (
                <div className="flex items-center justify-center gap-2">
                  {variation >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-lg font-semibold ${variation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variation >= 0 ? '+' : ''}{variation.toFixed(2)}%
                  </span>
                  <span className="text-muted-foreground">vs last week</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Currency Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USD Holdings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestWeek.totalUsd, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                ≈ {formatCurrency(latestWeek.totalUsd * latestWeek.rates.usdToBrl, 'BRL')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BRL Holdings</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestWeek.totalBrl, 'BRL')}</div>
              <p className="text-xs text-muted-foreground">
                Native currency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">EUR Holdings</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(latestWeek.totalEur, 'EUR')}</div>
              <p className="text-xs text-muted-foreground">
                ≈ {formatCurrency(latestWeek.totalEur * latestWeek.rates.eurToBrl, 'BRL')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exchange Rates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">USD → BRL</span>
                <Badge variant="secondary">
                  {latestWeek.rates.usdToBrl.toFixed(4)}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">EUR → BRL</span>
                <Badge variant="secondary">
                  {latestWeek.rates.eurToBrl.toFixed(4)}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">BTC → USD</span>
                <Badge variant="secondary">
                  {formatCurrency(latestWeek.rates.btcToUsd, 'USD')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Account Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestWeek.accounts
                .filter(account => account.usd > 0 || account.brl > 0 || account.eur > 0)
                .sort((a, b) => {
                  const totalA = a.brl + (a.usd * latestWeek.rates.usdToBrl) + (a.eur * latestWeek.rates.eurToBrl);
                  const totalB = b.brl + (b.usd * latestWeek.rates.usdToBrl) + (b.eur * latestWeek.rates.eurToBrl);
                  return totalB - totalA;
                })
                .slice(0, 5)
                .map((account) => {
                  const totalInBrl = account.brl + (account.usd * latestWeek.rates.usdToBrl) + (account.eur * latestWeek.rates.eurToBrl);
                  return (
                    <div key={account.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <div>
                        <span className="font-medium">{account.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {account.usd > 0 && `${formatCurrency(account.usd, 'USD')} `}
                          {account.brl > 0 && `${formatCurrency(account.brl, 'BRL')} `}
                          {account.eur > 0 && `${formatCurrency(account.eur, 'EUR')}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(totalInBrl, 'BRL')}</div>
                        <div className="text-sm text-muted-foreground">
                          {((totalInBrl / currentTotal) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};