
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Pill, BarChart3, TrendingUp, Layers, Package, FolderOpen } from 'lucide-react';
import { supabase, type Category } from '@/lib/supabase';
import { AddCategoryDialog } from '@/components/Dialogs/AddCategoryDialog';
import { EditCategoryDialog } from '@/components/Dialogs/EditCategoryDialog';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for category when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาหมวดหมู่: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoriesError) throw categoriesError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('category_id');

      if (productsError) throw productsError;

      // Count products per category
      const counts: Record<string, number> = {};
      productsData.forEach(product => {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      });

      setCategories(categoriesData || []);
      setProductCounts(counts);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลหมวดหมู่ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if category has products
      const productCount = productCounts[categoryId] || 0;
      if (productCount > 0) {
        toast({
          title: "ไม่สามารถลบได้",
          description: `หมวดหมู่นี้มีสินค้า ${productCount} รายการ กรุณาย้ายสินค้าไปหมวดหมู่อื่นก่อน`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "ลบหมวดหมู่สำเร็จแล้ว",
      });

      fetchCategories();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const totalCategories = categories.length;
  const medicineCategories = categories.filter(c => c.is_medicine).length;
  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-6 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="หมวดหมู่สินค้า"
          description="จัดการและจัดหมวดหมู่สินค้าอย่างเป็นระบบ"
          icon={Layers}
          stats={[
            {
              label: "หมวดหมู่ทั้งหมด",
              value: totalCategories.toString(),
              icon: BarChart3
            },
            {
              label: "หมวดหมู่ยา",
              value: medicineCategories.toString(),
              icon: Pill,
              color: medicineCategories > 0 ? 'bg-green-500' : 'bg-muted/50'
            },
            {
              label: "สินค้ารวม",
              value: totalProducts.toLocaleString(),
              icon: Package,
              trend: { value: "12%", isPositive: true }
            },
            {
              label: "ประสิทธิภาพ",
              value: "95%",
              icon: TrendingUp,
              color: 'bg-primary/80'
            }
          ]}
          secondaryActions={<AddCategoryDialog onCategoryAdded={fetchCategories} />}
        />

        {/* Enhanced Search */}
        <Card className="bg-gradient-to-br from-green-50 via-white to-blue-50 border-2 border-green-200 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-emerald-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
          </div>
          
          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="space-y-6">
              {/* Scanner Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl text-muted-foreground font-semibold">สถานะเครื่องสแกน:</span>
                  <BarcodeScannerIndicator isDetected={scannerDetected} />
                </div>
                {scannerDetected && (
                  <p className="text-base text-green-700 font-semibold bg-green-100 px-4 py-2 rounded-full border-2 border-green-300 shadow-sm">
                    ✨ พร้อมใช้งาน - สแกนบาร์โค้ดเพื่อค้นหาหมวดหมู่
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Search className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">ค้นหาหมวดหมู่</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาหมวดหมู่ ชื่อหรือคำอธิบาย..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 text-lg h-14 border-2 border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-200/50 bg-white/90 backdrop-blur-sm font-medium placeholder:text-muted-foreground/70"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="w-full min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
                  <CardContent className="p-6 relative z-10">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-blue-200 rounded"></div>
                      <div className="h-3 bg-blue-200 rounded w-3/4"></div>
                      <div className="h-3 bg-blue-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredCategories.map((category) => {
                const productCount = productCounts[category.id] || 0;
              
                return (
                  <Card key={category.id} className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
                    </div>
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                           <CardTitle className="text-base sm:text-lg font-bold text-blue-800 flex items-center gap-2">
                             <span className="break-words">{category.name}</span>
                             {category.is_medicine && (
                               <div className="flex items-center" title="หมวดหมู่ยา">
                                 <Pill className="h-4 w-4 text-green-600 flex-shrink-0" />
                               </div>
                             )}
                           </CardTitle>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50">
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent className="bg-gradient-to-br from-white to-blue-50 shadow-2xl border-2 border-blue-200">
                             <AlertDialogHeader>
                               <AlertDialogTitle className="text-lg font-bold text-blue-800">ยืนยันการลบ</AlertDialogTitle>
                               <AlertDialogDescription className="text-base">
                                 คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "{category.name}"? 
                                 {productCount > 0 && (
                                   <span className="text-destructive font-medium">
                                     <br />หมวดหมู่นี้มีสินค้า {productCount} รายการ
                                   </span>
                                 )}
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel className="border-2 border-blue-200 hover:bg-blue-50">ยกเลิก</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => handleDeleteCategory(category.id)}
                                 className="bg-red-500 hover:bg-red-600 text-white font-bold"
                               >
                                 ลบ
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="space-y-3 relative z-10">
                     <p className="text-sm text-muted-foreground break-words min-h-[2.5rem]">
                       {category.description || 'ไม่มีคำอธิบาย'}
                     </p>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-1">
                            {productCount.toLocaleString()} สินค้า
                          </Badge>
                          {category.is_medicine && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs font-bold px-3 py-1">
                              ยา
                            </Badge>
                          )}
                        </div>
                       <span className="text-xs text-muted-foreground truncate">
                         ID: {category.id.slice(0, 8)}...
                       </span>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         ) : (
           <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
             {/* Background decoration */}
             <div className="absolute inset-0 opacity-20">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
               <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
             </div>
             
             <CardContent className="p-12 text-center relative z-10">
               <FolderOpen className="h-16 w-16 text-blue-300 mx-auto mb-4" />
               <p className="text-lg font-medium text-blue-800">ไม่พบหมวดหมู่ที่ตรงกับการค้นหา</p>
             </CardContent>
           </Card>
         )}
       </div>
     </div>

     {/* Edit Category Dialog */}
     <EditCategoryDialog
       category={editingCategory}
       open={editDialogOpen}
       onOpenChange={setEditDialogOpen}
       onCategoryUpdated={fetchCategories}
     />
   </Layout>
 );
}
