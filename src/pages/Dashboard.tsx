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
  BarChart3
} from 'lucide-react';

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

        {/* Stock Overview - moved up to top area */}
        <div className="grid gap-6">
          <StockOverview />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-1">
          <RecentActivity movements={recentMovements} />
        </div>

        {/* Enhanced Analytics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Chart Area */}
          <div className="md:col-span-2">
            <StockChart />
          </div>
          
          {/* Enhanced Quick Insights */}
          <div className="space-y-6 md:sticky md:top-6">
            {/* Category Distribution */}
            <CategoryDistribution categories={topCategories} />
          </div>
        </div>


      </div>
    </Layout>
  );
}