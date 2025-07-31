import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Save, Plus, TrendingUp, DollarSign, Euro, Bitcoin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExchangeRates {
  usdToBrl: number;
  eurToBrl: number;
  btcToBrl: number;
}

interface AccountBalance {
  id: string;
  name: string;
  usd: number;
  brl: number;
  eur: number;
}

interface WeeklyData {
  id: string;
  date: string;
  rates: ExchangeRates;
  accounts: AccountBalance[];
  totalUsd: number;
  totalBrl: number;
  totalEur: number;
}

const DEFAULT_ACCOUNTS = [
  'ANDOLKER LLC',
  'ANDOLKER TRC',
  'BYBIT MAIN',
  'BYBIT SUBACCOUNT',
  'BINANCE',
  'MEXN',
  'GATE',
  'CRYPTOCOM',
  'METAMASK',
  'PHANTOM',
  'BRADESCO BR',
  'BRADESCO US',
  'C6',
  'WISE',
  'AVENUE'
];

const FinancialDashboard = () => {
  const { toast } = useToast();
  
  const [currentWeek, setCurrentWeek] = useState<WeeklyData>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    rates: { usdToBrl: 5.55, eurToBrl: 6.15, btcToBrl: 350000 },
    accounts: DEFAULT_ACCOUNTS.map((name, index) => ({
      id: `account-${index}`,
      name,
      usd: 0,
      brl: 0,
      eur: 0
    })),
    totalUsd: 0,
    totalBrl: 0,
    totalEur: 0
  });

  const [previousWeek, setPreviousWeek] = useState<WeeklyData | null>(null);
  const [savedWeeks, setSavedWeeks] = useState<WeeklyData[]>([]);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    const saved = localStorage.getItem('financialWeeks');
    if (saved) {
      const weeks = JSON.parse(saved);
      setSavedWeeks(weeks);
      if (weeks.length > 0) {
        setPreviousWeek(weeks[weeks.length - 1]);
      }
    }
  }, []);

  const calculateTotals = useCallback((accounts: AccountBalance[]) => {
    const totalUsd = accounts.reduce((sum, acc) => sum + acc.usd, 0);
    const totalBrl = accounts.reduce((sum, acc) => sum + acc.brl, 0);
    const totalEur = accounts.reduce((sum, acc) => sum + acc.eur, 0);
    return { totalUsd, totalBrl, totalEur };
  }, []);

  const convertValue = useCallback((value: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates) => {
    if (fromCurrency === toCurrency) return value;
    
    // Convert to BRL first (base currency)
    let brlValue = value;
    if (fromCurrency === 'USD') {
      brlValue = value * rates.usdToBrl;
    } else if (fromCurrency === 'EUR') {
      brlValue = value * rates.eurToBrl;
    }
    
    // Convert from BRL to target currency
    if (toCurrency === 'USD') {
      return brlValue / rates.usdToBrl;
    } else if (toCurrency === 'EUR') {
      return brlValue / rates.eurToBrl;
    }
    
    return brlValue;
  }, []);

  const updateAccountValue = (accountId: string, currency: 'usd' | 'brl' | 'eur', value: number) => {
    setCurrentWeek(prev => {
      const newAccounts = prev.accounts.map(account => {
        if (account.id === accountId) {
          const updatedAccount = { ...account };
          
          // Update the changed currency
          updatedAccount[currency] = value;
          
          // Convert to other currencies
          if (currency === 'usd') {
            updatedAccount.brl = convertValue(value, 'USD', 'BRL', prev.rates);
            updatedAccount.eur = convertValue(value, 'USD', 'EUR', prev.rates);
          } else if (currency === 'brl') {
            updatedAccount.usd = convertValue(value, 'BRL', 'USD', prev.rates);
            updatedAccount.eur = convertValue(value, 'BRL', 'EUR', prev.rates);
          } else if (currency === 'eur') {
            updatedAccount.brl = convertValue(value, 'EUR', 'BRL', prev.rates);
            updatedAccount.usd = convertValue(value, 'EUR', 'USD', prev.rates);
          }
          
          return updatedAccount;
        }
        return account;
      });
      
      const totals = calculateTotals(newAccounts);
      
      return {
        ...prev,
        accounts: newAccounts,
        ...totals
      };
    });
  };

  const updateExchangeRate = (rateType: keyof ExchangeRates, value: number) => {
    setCurrentWeek(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [rateType]: value
      }
    }));
  };

  const saveCurrentWeek = () => {
    const weekToSave = {
      ...currentWeek,
      id: `week-${Date.now()}`
    };
    
    const updatedWeeks = [...savedWeeks, weekToSave];
    setSavedWeeks(updatedWeeks);
    localStorage.setItem('financialWeeks', JSON.stringify(updatedWeeks));
    
    toast({
      title: "Semana salva com sucesso!",
      description: `Dados da semana ${weekToSave.date} foram salvos.`,
    });
  };

  const createNewWeek = () => {
    setPreviousWeek(currentWeek);
    
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
    
    setCurrentWeek({
      id: '',
      date: nextMonday.toISOString().split('T')[0],
      rates: currentWeek.rates, // Mantém as cotações da semana anterior
      accounts: DEFAULT_ACCOUNTS.map((name, index) => ({
        id: `account-${index}`,
        name,
        usd: 0,
        brl: 0,
        eur: 0
      })),
      totalUsd: 0,
      totalBrl: 0,
      totalEur: 0
    });
    
    setActiveTab('current');
    
    toast({
      title: "Nova semana criada!",
      description: "Valores zerados, cotações mantidas como referência.",
    });
  };

  const formatCurrency = (value: number, currency: string) => {
    const locale = currency === 'BRL' ? 'pt-BR' : currency === 'EUR' ? 'de-DE' : 'en-US';
    const currencyCode = currency;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getTotalPortfolioInBrl = () => {
    return currentWeek.totalBrl + 
           (currentWeek.totalUsd * currentWeek.rates.usdToBrl) + 
           (currentWeek.totalEur * currentWeek.rates.eurToBrl);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
              <p className="text-muted-foreground">Gestão semanal de portfólio</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={saveCurrentWeek} variant="success" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Semana
            </Button>
            <Button onClick={createNewWeek} variant="financial" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Semana
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Semana Atual</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {/* Exchange Rates Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cotações da Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={currentWeek.date}
                      onChange={(e) => setCurrentWeek(prev => ({ ...prev, date: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium min-w-[80px]">USD/BRL:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentWeek.rates.usdToBrl}
                      onChange={(e) => updateExchangeRate('usdToBrl', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium min-w-[80px]">EUR/BRL:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentWeek.rates.eurToBrl}
                      onChange={(e) => updateExchangeRate('eurToBrl', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium min-w-[80px]">BTC/BRL:</span>
                    <Input
                      type="number"
                      step="1000"
                      value={currentWeek.rates.btcToBrl}
                      onChange={(e) => updateExchangeRate('btcToBrl', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total USD</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(currentWeek.totalUsd, 'USD')}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary/60" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total BRL</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(currentWeek.totalBrl, 'BRL')}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-success/60">R$</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total EUR</p>
                      <p className="text-2xl font-bold text-warning">
                        {formatCurrency(currentWeek.totalEur, 'EUR')}
                      </p>
                    </div>
                    <Euro className="h-8 w-8 text-warning/60" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfólio Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(getTotalPortfolioInBrl(), 'BRL')}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accounts Table */}
            <Card>
              <CardHeader>
                <CardTitle>Saldos por Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Conta</th>
                        <th className="text-right p-2 font-medium">USD</th>
                        <th className="text-right p-2 font-medium">BRL</th>
                        <th className="text-right p-2 font-medium">EUR</th>
                        {previousWeek && (
                          <>
                            <th className="text-right p-2 font-medium text-muted-foreground">USD Ant.</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">BRL Ant.</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">EUR Ant.</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentWeek.accounts.map((account, index) => {
                        const prevAccount = previousWeek?.accounts.find(acc => acc.name === account.name);
                        return (
                          <tr key={account.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{account.name}</td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={account.usd || ''}
                                onChange={(e) => updateAccountValue(account.id, 'usd', parseFloat(e.target.value) || 0)}
                                className="w-full text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={account.brl || ''}
                                onChange={(e) => updateAccountValue(account.id, 'brl', parseFloat(e.target.value) || 0)}
                                className="w-full text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={account.eur || ''}
                                onChange={(e) => updateAccountValue(account.id, 'eur', parseFloat(e.target.value) || 0)}
                                className="w-full text-right"
                                placeholder="0.00"
                              />
                            </td>
                            {previousWeek && (
                              <>
                                <td className="p-2 text-right text-muted-foreground text-sm">
                                  {prevAccount ? formatCurrency(prevAccount.usd, 'USD') : '-'}
                                </td>
                                <td className="p-2 text-right text-muted-foreground text-sm">
                                  {prevAccount ? formatCurrency(prevAccount.brl, 'BRL') : '-'}
                                </td>
                                <td className="p-2 text-right text-muted-foreground text-sm">
                                  {prevAccount ? formatCurrency(prevAccount.eur, 'EUR') : '-'}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Semanas Salvas</CardTitle>
              </CardHeader>
              <CardContent>
                {savedWeeks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma semana salva ainda.</p>
                    <p className="text-sm">Salve uma semana para ver o histórico aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedWeeks.reverse().map((week) => (
                      <div key={week.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Semana de {new Date(week.date).toLocaleDateString('pt-BR')}</h3>
                          <Badge variant="outline">
                            {formatCurrency(
                              week.totalBrl + 
                              (week.totalUsd * week.rates.usdToBrl) + 
                              (week.totalEur * week.rates.eurToBrl), 
                              'BRL'
                            )}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">USD: </span>
                            <span className="font-medium">{formatCurrency(week.totalUsd, 'USD')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">BRL: </span>
                            <span className="font-medium">{formatCurrency(week.totalBrl, 'BRL')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">EUR: </span>
                            <span className="font-medium">{formatCurrency(week.totalEur, 'EUR')}</span>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                          <div>USD/BRL: {week.rates.usdToBrl}</div>
                          <div>EUR/BRL: {week.rates.eurToBrl}</div>
                          <div>BTC/BRL: {week.rates.btcToBrl.toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancialDashboard;