import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Settings, DollarSign, Euro, Banknote, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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
  const [allWeeks, setAllWeeks] = useState<WeeklyData[]>([]);

  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      const savedWeeks = localStorage.getItem('financialWeeks');
      if (savedWeeks) {
        try {
          const weeks: WeeklyData[] = JSON.parse(savedWeeks);
          setAllWeeks(weeks);
          
          if (weeks.length > 0) {
            const sortedWeeks = weeks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setLatestWeek(sortedWeeks[0]);
            if (sortedWeeks.length > 1) {
              setPreviousWeek(sortedWeeks[1]);
            }
          }
        } catch (error) {
          console.error('Error loading financial data:', error);
        }
      }
    };

    // Load initial data
    loadData();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'financialWeeks') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomUpdate = () => {
      loadData();
    };

    window.addEventListener('financialDataUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('financialDataUpdated', handleCustomUpdate);
    };
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

  const formatNumber = (value: number) => {
    return Number(value).toFixed(2);
  };

  const getTotalPortfolioInBrl = () => {
    return latestWeek.totalBrl + 
           (latestWeek.totalUsd * latestWeek.rates.usdToBrl) + 
           (latestWeek.totalEur * latestWeek.rates.eurToBrl);
  };

  const getTotalPortfolioInUsd = () => {
    return (latestWeek.totalBrl / latestWeek.rates.usdToBrl) + 
           latestWeek.totalUsd + 
           (latestWeek.totalEur * latestWeek.rates.eurToBrl / latestWeek.rates.usdToBrl);
  };

  const getTotalPortfolioInEur = () => {
    return (latestWeek.totalBrl / latestWeek.rates.eurToBrl) + 
           (latestWeek.totalUsd * latestWeek.rates.usdToBrl / latestWeek.rates.eurToBrl) + 
           latestWeek.totalEur;
  };

  const currentTotalBrl = getTotalPortfolioInBrl();
  const currentTotalUsd = getTotalPortfolioInUsd();
  const currentTotalEur = getTotalPortfolioInEur();

  // Calculate trends
  const getTrend = (current: number, previous: number) => {
    if (!previous) return { value: 0, direction: 'none' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'none' as const
    };
  };

  const getPreviousTotalInBrl = () => {
    if (!previousWeek) return 0;
    return previousWeek.totalBrl + 
           (previousWeek.totalUsd * previousWeek.rates.usdToBrl) + 
           (previousWeek.totalEur * previousWeek.rates.eurToBrl);
  };

  const trendBrl = getTrend(currentTotalBrl, getPreviousTotalInBrl());

  // Prepare chart data
  const chartData = allWeeks
    .slice()
    .reverse()
    .map(week => {
      const totalInBrl = week.totalBrl + 
                        (week.totalUsd * week.rates.usdToBrl) + 
                        (week.totalEur * week.rates.eurToBrl);
      const totalInUsd = (week.totalBrl / week.rates.usdToBrl) + 
                        week.totalUsd + 
                        (week.totalEur * week.rates.eurToBrl / week.rates.usdToBrl);
      return {
        week: new Date(week.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        totalBrl: totalInBrl,
        totalUsd: totalInUsd
      };
    });

  const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'none' }) => {
    if (direction === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

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

        {/* Total Portfolio in All Currencies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-sm text-muted-foreground mb-2">Total em USD</h2>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(currentTotalUsd, 'USD')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-sm text-muted-foreground">Total em BRL</h2>
                  {previousWeek && (
                    <div className="flex items-center gap-1">
                      <TrendIcon direction={trendBrl.direction} />
                      <span className={`text-xs ${
                        trendBrl.direction === 'up' ? 'text-green-500' : 
                        trendBrl.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {formatNumber(trendBrl.value)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(currentTotalBrl, 'BRL')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-sm text-muted-foreground mb-2">Total em EUR</h2>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(currentTotalEur, 'EUR')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Portfolio Evolution Chart */}
        {chartData.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução do Portfolio (BRL / USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="brl"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="usd"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Line 
                      yAxisId="brl"
                      type="monotone" 
                      dataKey="totalBrl" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                      name="BRL"
                    />
                    <Line 
                      yAxisId="usd"
                      type="monotone" 
                      dataKey="totalUsd" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
                      name="USD"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Exchange Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">USD → BRL</div>
                <div className="text-lg font-bold">{formatNumber(latestWeek.rates.usdToBrl)}</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">EUR → BRL</div>
                <div className="text-lg font-bold">{formatNumber(latestWeek.rates.eurToBrl)}</div>
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