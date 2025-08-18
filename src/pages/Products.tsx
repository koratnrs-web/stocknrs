import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Package, BarChart3, TrendingUp, AlertTriangle, Eye, Bell, User, LogOut } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { AddProductDialog } from '@/components/Dialogs/AddProductDialog';
import { EditProductDialog } from '@/components/Dialogs/EditProductDialog';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

interface ProductWithCategory extends Product {
  categories?: { name: string };
  suppliers?: { name: string };
}

export default function Products() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for product when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาสินค้า: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.current_stock <= product.min_stock;
    } else if (stockFilter === 'out') {
      matchesStock = product.current_stock === 0;
    } else if (stockFilter === 'normal') {
      matchesStock = product.current_stock > product.min_stock;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const fetchProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(name)
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "ลบสินค้าสำเร็จแล้ว",
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock).length;
  const outOfStockProducts = products.filter(p => p.current_stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0);

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-6 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="สินค้า"
          description="จัดการสินค้าและสต็อกอย่างครบถ้วน"
          icon={Package}
          stats={[
            {
              label: "สินค้าทั้งหมด",
              value: totalProducts.toString(),
              icon: Package
            },
            {
              label: "สต็อกต่ำ",
              value: lowStockProducts.toString(),
              icon: AlertTriangle,
              color: lowStockProducts > 0 ? 'bg-yellow-500' : 'bg-muted/50'
            },
            {
              label: "หมดสต็อก",
              value: outOfStockProducts.toString(),
              icon: TrendingUp,
              color: outOfStockProducts > 0 ? 'bg-red-500' : 'bg-muted/50'
            },
            {
              label: "มูลค่ารวม",
              value: `฿${totalValue.toLocaleString()}`,
              icon: BarChart3
            }
          ]}
          secondaryActions={<AddProductDialog onProductAdded={fetchProducts} />}
        />

        {/* Filters */}
        <Card className="bg-gradient-to-br from-green-50 via-white to-emerald-50 border-2 border-green-200 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-200 rounded-full -translate-y-24 translate-x-24 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-200 rounded-full translate-y-28 -translate-x-28 blur-2xl"></div>
          </div>
          
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="space-y-4">
              {/* Scanner Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base text-muted-foreground font-medium">สถานะเครื่องสแกน:</span>
                  <BarcodeScannerIndicator isDetected={scannerDetected} />
                </div>
                {scannerDetected && (
                  <p className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    พร้อมใช้งาน - สแกนบาร์โค้ดเพื่อค้นหาสินค้า
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="ค้นหาสินค้า ชื่อ SKU หรือคำอธิบาย..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-base h-12 border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-12 text-base border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="หมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-base">ทุกหมวดหมู่</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id} className="text-base">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-12 text-base border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="สถานะสต็อก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-base">ทุกสถานะ</SelectItem>
                    <SelectItem value="normal" className="text-base">สต็อกปกติ</SelectItem>
                    <SelectItem value="low" className="text-base">สต็อกต่ำ</SelectItem>
                    <SelectItem value="out" className="text-base">หมดสต็อก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Header Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-green-200">
                <div className="flex items-center space-x-2">
                  <AddProductDialog onProductAdded={fetchProducts} />
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative hover:bg-green-100 h-10 px-3">
                    <Bell className="h-5 w-5 text-green-700" />
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

        {/* Products Table */}
        <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
          </div>
          
          <CardHeader className="pb-6 relative z-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg -m-6 mb-6 p-6 shadow-lg">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
              <Package className="h-7 w-7 mr-3 text-blue-200" />
              รายการสินค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-8 relative z-10">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <span className="ml-3 text-lg font-medium">กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white/60 backdrop-blur-sm rounded-lg border border-blue-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">สินค้า</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 hidden sm:table-cell text-blue-800">SKU</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">หมวดหมู่</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">สต็อก</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 hidden md:table-cell text-blue-800">ราคา</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 hidden lg:table-cell text-blue-800">สถานะ</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-lg font-medium bg-gray-50/50">
                          ไม่พบสินค้าที่ตรงกับการค้นหา
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product, index) => (
                        <TableRow 
                          key={product.id} 
                          className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white/40' : 'bg-blue-50/20'
                          }`}
                        >
                          <TableCell className="font-bold text-base sm:text-lg py-4">
                            <div className="max-w-[250px] truncate" title={product.name}>
                              {product.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-base sm:text-lg hidden sm:table-cell py-4">
                            {product.sku}
                          </TableCell>
                          <TableCell className="text-base sm:text-lg py-4">
                            {product.categories?.name || 'ไม่ระบุ'}
                          </TableCell>
                          <TableCell className="text-base sm:text-lg font-bold py-4">
                            <span className={product.current_stock <= product.min_stock ? 'text-yellow-600' : 'text-foreground'}>
                              {product.current_stock.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-base sm:text-lg font-bold py-4 hidden md:table-cell">
                            ฿{product.unit_price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-base sm:text-lg hidden lg:table-cell py-4">
                            <Badge 
                              variant={product.current_stock > product.min_stock ? 'default' : product.current_stock > 0 ? 'secondary' : 'destructive'}
                              className={`text-base font-bold px-4 py-2 ${product.current_stock > product.min_stock ? 'bg-green-500/10 text-green-600' : product.current_stock > 0 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}
                            >
                              {product.current_stock > product.min_stock ? 'ปกติ' : product.current_stock > 0 ? 'ต่ำ' : 'หมด'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                className="h-12 w-12 hover:bg-blue-50"
                              >
                                <Edit className="h-6 w-6" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive h-12 w-12 hover:bg-red-50"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-6 w-6" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editingProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProductUpdated={fetchProducts}
      />
    </Layout>
  );
}