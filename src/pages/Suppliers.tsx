
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, CheckCircle, Building2 } from 'lucide-react';
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
      <div className="w-full space-y-6 pb-8">
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

        {/* Search */}
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
                    ✨ พร้อมใช้งาน - สแกนบาร์โค้ดเพื่อค้นหาผู้จัดหา
                  </p>
                )}
              </div>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                <Input
                  placeholder="ค้นหาผู้จัดหา ชื่อหรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 text-lg h-14 border-2 border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-200/50 bg-white/90 backdrop-blur-sm font-medium placeholder:text-muted-foreground/70"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Grid */}
        <div className="w-full min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredSuppliers.map((supplier) => {
                const productCount = productCounts[supplier.id] || 0;
                const status = productCount > 0 ? 'active' : 'inactive';
              
                return (
                  <Card key={supplier.id} className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 h-fit relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 rounded-full translate-y-20 -translate-x-20 blur-2xl"></div>
                    </div>
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge variant={status === 'active' ? 'default' : 'secondary'} 
                                 className={`text-xs font-bold px-3 py-1 ${status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}`}>
                            {status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditSupplier(supplier)}
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gradient-to-br from-white to-blue-50 shadow-2xl border-2 border-blue-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-lg font-bold text-blue-800">ยืนยันการลบ</AlertDialogTitle>
                                  <AlertDialogDescription className="text-base">
                                    คุณแน่ใจหรือไม่ที่จะลบผู้จัดหา "{supplier.name}"? การกระทำนี้ไม่สามารถยกเลิกได้
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-2 border-blue-200 hover:bg-blue-50">ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSupplier(supplier.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold"
                                  >
                                    ลบ
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                      
                      {/* Company Name - Moved to separate line */}
                      <CardTitle className="text-lg sm:text-xl font-bold text-blue-800 break-words leading-tight">
                        {supplier.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-3 h-4 w-4 flex-shrink-0 text-blue-500" />
                          <span className="break-all flex-1">{supplier.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-3 h-4 w-4 flex-shrink-0 text-green-500" />
                          <span className="break-all flex-1">{supplier.phone}</span>
                        </div>
                        {supplier.address && (
                          <div className="flex items-start text-sm text-muted-foreground">
                            <MapPin className="mr-3 h-4 w-4 flex-shrink-0 mt-0.5 text-orange-500" />
                            <span className="break-words flex-1">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-blue-100">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-1">
                          {productCount.toLocaleString()} สินค้า
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          ID: {supplier.id.slice(0, 8)}...
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
                <Building2 className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-blue-800">ไม่พบผู้จัดหาที่ตรงกับการค้นหา</p>
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
