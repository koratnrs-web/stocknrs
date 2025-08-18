
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, CheckCircle, Bell, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { supabase, type Supplier } from '@/lib/supabase';
import { AddSupplierDialog } from '@/components/Dialogs/AddSupplierDialog';
import { EditSupplierDialog } from '@/components/Dialogs/EditSupplierDialog';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for supplier when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาผู้จัดหา: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSuppliers = async () => {
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('supplier_id');

      if (productsError) throw productsError;

      // Count products per supplier
      const counts: Record<string, number> = {};
      productsData.forEach(product => {
        counts[product.supplier_id] = (counts[product.supplier_id] || 0) + 1;
      });

      setSuppliers(suppliersData || []);
      setProductCounts(counts);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้จัดหาได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditDialogOpen(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "ลบผู้จัดหาสำเร็จแล้ว",
      });

      fetchSuppliers();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้จัดหาได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-8 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="ผู้จัดหา"
          description="จัดการข้อมูลผู้จัดหาและซัพพลายเออร์อย่างครบถ้วน"
          icon={User}
          stats={[
            {
              label: "ผู้จัดหาทั้งหมด",
              value: suppliers.length.toString(),
              icon: User
            },
            {
              label: "ผู้จัดหาที่ใช้งาน",
              value: Object.values(productCounts).filter(count => count > 0).length.toString(),
              icon: CheckCircle
            }
          ]}
          secondaryActions={<AddSupplierDialog onSupplierAdded={fetchSuppliers} />}
        />

        {/* Search and Add */}
        <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200 rounded-full -translate-y-24 translate-x-24 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-200 rounded-full translate-y-28 -translate-x-28 blur-2xl"></div>
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
                  <p className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    พร้อมใช้งาน - สแกนบาร์โค้ดเพื่อค้นหาผู้จัดหา
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="ค้นหาผู้จัดหา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-base h-12 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                
                <AddSupplierDialog onSupplierAdded={fetchSuppliers} />
              </div>

              {/* Header Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-emerald-200">
                <div className="flex items-center space-x-2">
                  {/* Additional actions can be added here */}
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative hover:bg-emerald-100 h-10 px-3">
                    <Bell className="h-5 w-5 text-emerald-700" />
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

        {/* Suppliers Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 shadow-xl relative overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredSuppliers.map((supplier) => {
                const productCount = productCounts[supplier.id] || 0;
                const status = productCount > 0 ? 'active' : 'inactive';
              
                return (
                  <Card key={supplier.id} className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-200 h-fit relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-150 transition-transform duration-300"></div>
                    </div>
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 flex-1 min-w-0">
                          <span className="break-words">{supplier.name}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge variant={status === 'active' ? 'default' : 'secondary'} 
                                 className={`text-sm font-semibold px-3 py-1 ${status === 'active' ? 'bg-green-500/10 text-green-700 border-2 border-green-200' : 'bg-gray-500/10 text-gray-600 border-2 border-gray-200'}`}>
                            {status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-emerald-50"
                              onClick={() => handleEditSupplier(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gradient-to-br from-white to-red-50 border-2 border-red-200 shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-bold text-gray-800">ยืนยันการลบ</AlertDialogTitle>
                                  <AlertDialogDescription className="text-base text-gray-600">
                                    คุณแน่ใจหรือไม่ที่จะลบผู้จัดหา "{supplier.name}"? การกระทำนี้ไม่สามารถยกเลิกได้
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50">ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSupplier(supplier.id)}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                                  >
                                    ลบ
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600 font-medium">
                          <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-emerald-600" />
                          <span className="break-all flex-1">{supplier.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 font-medium">
                          <Phone className="mr-3 h-4 w-4 flex-shrink-0 text-emerald-600" />
                          <span className="break-all flex-1">{supplier.phone}</span>
                        </div>
                        {supplier.address && (
                          <div className="flex items-start text-sm text-gray-600 font-medium">
                            <MapPin className="mr-3 h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                            <span className="break-words flex-1">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 text-sm font-semibold px-3 py-1">
                          {productCount.toLocaleString()} สินค้า
                        </Badge>
                        <span className="text-xs text-gray-500 truncate font-medium">
                          ID: {supplier.id.slice(0, 8)}...
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50 via-white to-gray-100 border-2 border-gray-200 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <p className="text-lg text-gray-600 font-medium">ไม่พบผู้จัดหาที่ตรงกับการค้นหา</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        supplier={editingSupplier}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSupplierUpdated={fetchSuppliers}
      />
    </Layout>
  );
}
