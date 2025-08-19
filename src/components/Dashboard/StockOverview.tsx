import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStock } from '@/contexts/StockContext';
import { AlertTriangle, Package, TrendingDown, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StockOverview() {
  const { products, categories, getStockLevel } = useStock();

  const lowStockProducts = products.filter(p => getStockLevel(p) === 'low');
  const outOfStockProducts = products.filter(p => getStockLevel(p) === 'out');

  const getStockBadgeVariant = (level: string) => {
    switch (level) {
      case 'out': return 'destructive';
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'default';
      default: return 'default';
    }
  };

  const getStockBadgeColor = (level: string) => {
    switch (level) {
      case 'out': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'low': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'medium': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'high': return 'bg-green-500/10 text-green-600 border-green-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Low Stock Alerts */}
      <Card className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-2 border-yellow-200 shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
        </div>
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center text-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            แจ้งเตือนสินค้าใกล้หมด
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-2 border-yellow-300 font-bold px-3 py-1">
            {lowStockProducts.length}
          </Badge>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {lowStockProducts.slice(0, 5).map(product => {
              const category = categories.find(c => c.id === product.category_id);
              return (
                <div key={product.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-yellow-200/50 hover:border-yellow-300 transition-all duration-200">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm text-muted-foreground">{category?.name}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge 
                      variant={getStockBadgeVariant(getStockLevel(product))}
                      className={`text-sm font-bold px-3 py-1 border-2 ${getStockBadgeColor(getStockLevel(product))}`}
                    >
                      {product.current_stock} เหลือ
                    </Badge>
                    <p className="text-sm text-gray-600 font-medium">ขั้นต่ำ: {product.min_stock}</p>
                  </div>
                </div>
              );
            })}
            {lowStockProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-base text-gray-600 font-medium">ไม่มีสินค้าใกล้หมด</p>
              </div>
            )}
            {lowStockProducts.length > 5 && (
              <div className="text-center pt-3">
                <Button variant="outline" size="sm" asChild className="border-2 border-yellow-300 hover:bg-yellow-50 text-yellow-700 font-medium">
                  <Link to="/products?filter=low">ดูสินค้าใกล้หมดทั้งหมด</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card className="bg-gradient-to-br from-red-50 via-white to-pink-50 border-2 border-red-200 shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-rose-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
        </div>
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            สินค้าหมดสต็อก
          </CardTitle>
          <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-2 border-red-300 font-bold px-3 py-1">
            {outOfStockProducts.length}
          </Badge>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {outOfStockProducts.slice(0, 5).map(product => {
              const category = categories.find(c => c.id === product.category_id);
              return (
                <div key={product.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-red-200/50 hover:border-red-300 transition-all duration-200">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm text-muted-foreground">{category?.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-2 border-red-300 text-sm font-bold px-3 py-1">
                      สินค้าหมด
                    </Badge>
                  </div>
                </div>
              );
            })}
            {outOfStockProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-base text-gray-600 font-medium">สินค้าทั้งหมดมีสต็อก</p>
              </div>
            )}
            {outOfStockProducts.length > 5 && (
              <div className="text-center pt-3">
                <Button variant="outline" size="sm" asChild className="border-2 border-red-300 hover:bg-red-50 text-red-700 font-medium">
                  <Link to="/products?filter=out">ดูสินค้าหมดสต็อกทั้งหมด</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}