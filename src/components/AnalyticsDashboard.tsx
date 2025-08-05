import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon, Filter } from 'lucide-react';

interface WeeklyData {
  id: string;
  date: string;
  rates: {
    usdToBrl: number;
    eurToBrl: number;
    btcToUsd: number;
  };
  accounts: {
    id: string;
    name: string;
    usd: number;
    brl: number;
    eur: number;
  }[];
  totalUsd: number;
  totalBrl: number;
  totalEur: number;
}

interface AnalyticsDashboardProps {
  savedWeeks: WeeklyData[];
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ savedWeeks, onClose }) => {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');

  // Get all unique account names
  const allAccounts = useMemo(() => {
    const accountNames = new Set<string>();
    savedWeeks.forEach(week => {
      week.accounts.forEach(account => {
        if (account.usd > 0 || account.brl > 0 || account.eur > 0) {
          accountNames.add(account.name);
        }
      });
    });
    return Array.from(accountNames).sort();
  }, [savedWeeks]);

  // Convert value to USD
  const convertToUSD = (usd: number, brl: number, eur: number, rates: WeeklyData['rates']) => {
    return usd + (brl / rates.usdToBrl) + (eur * rates.eurToBrl / rates.usdToBrl);
  };

  // Convert value to BRL
  const convertToBRL = (usd: number, brl: number, eur: number, rates: WeeklyData['rates']) => {
    return brl + (usd * rates.usdToBrl) + (eur * rates.eurToBrl);
  };

  // Prepare data for USD evolution chart
  const usdEvolutionData = useMemo(() => {
    return savedWeeks.map((week, index) => {
      const totalValueUSD = convertToUSD(week.totalUsd, week.totalBrl, week.totalEur, week.rates);
      const prevWeek = index > 0 ? savedWeeks[index - 1] : null;
      const prevValueUSD = prevWeek ? convertToUSD(prevWeek.totalUsd, prevWeek.totalBrl, prevWeek.totalEur, prevWeek.rates) : totalValueUSD;
      const variationUSD = prevValueUSD > 0 ? ((totalValueUSD - prevValueUSD) / prevValueUSD) * 100 : 0;

      return {
        date: new Date(week.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        total: Math.round(totalValueUSD),
        variation: variationUSD
      };
    });
  }, [savedWeeks]);

  // Prepare data for BRL evolution chart
  const brlEvolutionData = useMemo(() => {
    return savedWeeks.map((week, index) => {
      const totalValueBRL = convertToBRL(week.totalUsd, week.totalBrl, week.totalEur, week.rates);
      const prevWeek = index > 0 ? savedWeeks[index - 1] : null;
      const prevValueBRL = prevWeek ? convertToBRL(prevWeek.totalUsd, prevWeek.totalBrl, prevWeek.totalEur, prevWeek.rates) : totalValueBRL;
      const variationBRL = prevValueBRL > 0 ? ((totalValueBRL - prevValueBRL) / prevValueBRL) * 100 : 0;

      return {
        date: new Date(week.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        total: Math.round(totalValueBRL),
        variation: variationBRL
      };
    });
  }, [savedWeeks]);

  // Prepare data for account evolution chart
  const accountEvolutionData = useMemo(() => {
    const accountsToShow = selectedAccounts.length > 0 ? selectedAccounts : allAccounts.slice(0, 5);
    
    return savedWeeks.map(week => {
      const dataPoint: any = {
        date: new Date(week.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      accountsToShow.forEach(accountName => {
        const account = week.accounts.find(acc => acc.name === accountName);
        if (account) {
          dataPoint[accountName] = convertToBRL(account.usd, account.brl, account.eur, week.rates);
        } else {
          dataPoint[accountName] = 0;
        }
      });

      return dataPoint;
    });
  }, [savedWeeks, selectedAccounts, allAccounts]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (savedWeeks.length === 0) return null;

    const firstWeek = savedWeeks[0];
    const lastWeek = savedWeeks[savedWeeks.length - 1];
    
    const firstTotalBRL = convertToBRL(firstWeek.totalUsd, firstWeek.totalBrl, firstWeek.totalEur, firstWeek.rates);
    const lastTotalBRL = convertToBRL(lastWeek.totalUsd, lastWeek.totalBrl, lastWeek.totalEur, lastWeek.rates);
    
    const totalGrowth = firstTotalBRL > 0 ? ((lastTotalBRL - firstTotalBRL) / firstTotalBRL) * 100 : 0;
    const averageWeekly = savedWeeks.length > 1 ? totalGrowth / (savedWeeks.length - 1) : 0;

    return {
      totalGrowth,
      averageWeekly,
      firstTotal: firstTotalBRL,
      lastTotal: lastTotalBRL,
      weeksTracked: savedWeeks.length
    };
  }, [savedWeeks]);

  const toggleAccount = (accountName: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountName) 
        ? prev.filter(name => name !== accountName)
        : [...prev, accountName]
    );
  };

  const formatCurrencyBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyUSDCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  if (savedWeeks.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              You need at least one saved week to view analytics.
            </p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
                <p className="text-muted-foreground">Visual insights and trends</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Chart Type:</span>
                  <Select value={chartType} onValueChange={(value: 'bar' | 'line') => setChartType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Accounts:</span>
                  <div className="flex flex-wrap gap-2">
                    {allAccounts.slice(0, 8).map(account => (
                      <div key={account} className="flex items-center space-x-2">
                        <Checkbox
                          id={account}
                          checked={selectedAccounts.includes(account)}
                          onCheckedChange={() => toggleAccount(account)}
                        />
                        <label htmlFor={account} className="text-xs font-medium cursor-pointer">
                          {account}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {overallStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Growth</p>
                      <p className={`text-2xl font-bold ${overallStats.totalGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {overallStats.totalGrowth.toFixed(1)}%
                      </p>
                    </div>
                    {overallStats.totalGrowth >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-success" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-destructive" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Weekly</p>
                    <p className={`text-2xl font-bold ${overallStats.averageWeekly >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {overallStats.averageWeekly.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Week</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrencyBRL(overallStats.firstTotal)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Latest Week</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrencyBRL(overallStats.lastTotal)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Portfolio Evolution in USD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {chartType === 'line' ? <LineChartIcon className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
                Evolução do Portfolio (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                 {chartType === 'line' ? (
                   <LineChart data={usdEvolutionData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                     <YAxis 
                       stroke="hsl(var(--foreground))" 
                       tickFormatter={formatCurrencyUSDCompact}
                     />
                     <Tooltip 
                       contentStyle={{
                         backgroundColor: 'hsl(var(--card))',
                         border: '1px solid hsl(var(--border))',
                         borderRadius: '6px'
                       }}
                        formatter={(value: any, name: string) => [
                          formatCurrencyUSD(value),
                          'Total Portfolio (USD)'
                        ]}
                     />
                     <Legend 
                       wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                     />
                     <Line 
                       type="monotone" 
                       dataKey="total" 
                       stroke="hsl(var(--primary))" 
                       strokeWidth={3}
                       dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                       name="Total Portfolio (USD)"
                     />
                   </LineChart>
                ) : (
                  <BarChart data={usdEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                    <YAxis 
                      stroke="hsl(var(--foreground))" 
                      tickFormatter={formatCurrencyUSDCompact}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: any) => [formatCurrencyUSD(value), 'Total Portfolio']}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Variation Chart - BRL */}
          <Card>
            <CardHeader>
              <CardTitle>Variação Semanal Percentual (BRL)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brlEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Variação']}
                  />
                  <Bar dataKey="variation">
                    {brlEvolutionData.map((entry, index) => (
                      <rect
                        key={`cell-${index}`}
                        fill={entry.variation >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Account Evolution Chart */}
          {(selectedAccounts.length > 0 || allAccounts.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução das Contas (BRL)
                  <Badge variant="secondary">{selectedAccounts.length || 'Top 5'} contas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={accountEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    {(selectedAccounts.length > 0 ? selectedAccounts : allAccounts.slice(0, 5)).map((account, index) => (
                      <Line
                        key={account}
                        type="monotone"
                        dataKey={account}
                        stroke={`hsl(${(index * 50) % 360} 70% 50%)`}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;