import React, { useMemo } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { StockOverview } from '@/components/Dashboard/StockOverview';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';
import { StockChart } from '@/components/Dashboard/StockChart';
import { CategoryDistribution } from '@/components/Dashboard/CategoryDistribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStock } from '@/contexts/StockContext';
import {
  BarChart3,
  Search,
  Bell,
  User,
  LogOut
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { stats, products, categories, suppliers, movements, refreshData } = useStock();



  // Get top performing categories
  const topCategories = useMemo(() => {
    return categories.slice(0, 3).map(category => {
      const categoryProducts = products.filter(p => p.category_id === category.id);
      const totalValue = categoryProducts.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0);
      return {
        ...category,
        productCount: categoryProducts.length,
        totalValue
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [categories, products]);

  // Get recent movements for activity feed
  const recentMovements = useMemo(() => {
    return movements
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 5);
  }, [movements]);


  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-8 pb-8">
        {/* Enhanced Page Header */}
        <PageHeader 
          title="แดชบอร์ด"
          description="ภาพรวมระบบจัดการสต็อกสินค้าแบบครบวงจร"
          icon={BarChart3}
        />

        {/* Search and Actions Card */}
        <Card className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-2 border-indigo-200 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-200 rounded-full -translate-y-24 translate-x-24 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-200 rounded-full translate-y-28 -translate-x-28 blur-2xl"></div>
          </div>
          
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="ค้นหาสินค้า, SKU, หรือบาร์โค้ด..."
                    className="pl-10 text-base h-12 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-indigo-200">
                <div className="flex items-center space-x-2">
                  {/* Additional actions can be added here */}
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative hover:bg-indigo-100 h-10 px-3">
                    <Bell className="h-5 w-5 text-indigo-700" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      3
                    </Badge>
                  </Button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">ผู้ใช้ระบบ</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 h-10 px-3"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      ออกจากระบบ
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Overview - moved up to top area */}
        <div className="grid gap-6">
          <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <StockOverview />
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-1">
          <Card className="bg-gradient-to-br from-green-50 via-white to-emerald-50 border-2 border-green-200 shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-200 rounded-full -translate-y-24 translate-x-24 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-200 rounded-full translate-y-28 -translate-x-28 blur-2xl"></div>
            </div>
            <div className="relative z-10">
              <RecentActivity movements={recentMovements} />
            </div>
          </Card>
        </div>

        {/* Enhanced Analytics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Chart Area */}
          <div className="md:col-span-2">
            <Card className="bg-gradient-to-br from-purple-50 via-white to-pink-50 border-2 border-purple-200 shadow-xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-56 h-56 bg-purple-200 rounded-full -translate-y-28 translate-x-28 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-200 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>
              </div>
              <div className="relative z-10">
                <StockChart />
              </div>
            </Card>
          </div>
          
          {/* Enhanced Quick Insights */}
          <div className="space-y-6 md:sticky md:top-6">
            {/* Category Distribution */}
            <Card className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 border-2 border-orange-200 shadow-xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-200 rounded-full -translate-y-20 translate-x-20 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-200 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>
              </div>
              <div className="relative z-10">
                <CategoryDistribution categories={topCategories} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}