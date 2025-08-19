import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Package } from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
  productCount: number;
  totalValue: number;
}

interface CategoryDistributionProps {
  categories: CategoryData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export function CategoryDistribution({ categories }: CategoryDistributionProps) {
  const chartData = useMemo(() => {
    return categories.map((category, index) => ({
      name: category.name,
      value: category.totalValue,
      productCount: category.productCount,
      color: COLORS[index % COLORS.length]
    }));
  }, [categories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('th-TH').format(value);
  };

  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);
  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-white to-violet-50 border-2 border-purple-200 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-indigo-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-lg sm:text-xl font-bold text-purple-800 flex items-center">
          <Package className="h-6 w-6 mr-3 text-purple-600" />
          การกระจายหมวดหมู่
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-all duration-200">
            <p className="text-2xl font-bold text-purple-800">{formatNumber(totalProducts)}</p>
            <p className="text-sm text-purple-600 font-medium">รายการสินค้าทั้งหมด</p>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-all duration-200">
            <p className="text-2xl font-bold text-purple-800">{formatCurrency(totalValue)}</p>
            <p className="text-sm text-purple-600 font-medium">มูลค่ารวม</p>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'มูลค่า']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="space-y-3">
          {categories.map((category, index) => {
            const percentage = totalValue > 0 ? (category.totalValue / totalValue) * 100 : 0;
            return (
              <div key={category.id} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-purple-200/50 hover:border-purple-300 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-semibold text-purple-800">{category.name}</span>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 border-2 border-purple-300 text-xs font-bold px-3 py-1">
                    {category.productCount} รายการ
                  </Badge>
                  <p className="text-sm text-purple-600 mt-2 font-medium">
                    {percentage.toFixed(1)}% • {formatCurrency(category.totalValue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <p className="text-base text-purple-600 font-medium">ยังไม่มีข้อมูลหมวดหมู่</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
