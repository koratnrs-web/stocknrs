
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ArrowUp, ArrowDown, Package, Loader2, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Movement } from '@/lib/supabase';
import { AddMovementDialog } from '@/components/Dialogs/AddMovementDialog';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

interface MovementWithProduct extends Movement {
  product_name: string;
  product_sku: string;
}

export default function Movements() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [movements, setMovements] = useState<MovementWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for movement when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาการเคลื่อนไหว: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          products!inner (
            name,
            sku
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const movementsWithProduct = data?.map(movement => ({
        ...movement,
        product_name: movement.products.name,
        product_sku: movement.products.sku
      })) || [];

      setMovements(movementsWithProduct);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลการเคลื่อนไหวสต็อกได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.product_sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const todayMovements = movements.filter(m => 
    new Date(m.created_at).toDateString() === new Date().toDateString()
  );

  const todayStockIn = todayMovements.filter(m => m.type === 'in').length;
  const todayStockOut = todayMovements.filter(m => m.type === 'out').length;

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-6 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="การเคลื่อนไหวสต็อก"
          description="ติดตามและจัดการการรับเข้าและเบิกออกสต็อกทั้งหมด"
          icon={Activity}
          stats={[
            {
              label: "รับเข้าวันนี้",
              value: todayStockIn.toString(),
              icon: ArrowUp,
              color: 'bg-green-500'
            },
            {
              label: "เบิกออกวันนี้", 
              value: todayStockOut.toString(),
              icon: ArrowDown,
              color: 'bg-red-500'
            },
            {
              label: "รายการทั้งหมด",
              value: movements.length.toLocaleString(),
              icon: Package
            }
          ]}
          secondaryActions={<AddMovementDialog onMovementAdded={fetchMovements} />}
        />

        {/* Filters */}
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
                    ✨ พร้อมใช้งาน - สแกนบาร์โค้ดเพื่อค้นหาการเคลื่อนไหว
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                  <Input
                    placeholder="ค้นหารายการเคลื่อนไหว ชื่อสินค้า SKU หรือเลขที่อ้างอิง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 text-lg h-14 border-2 border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-200/50 bg-white/90 backdrop-blur-sm font-medium placeholder:text-muted-foreground/70"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-14 text-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 bg-white/90 backdrop-blur-sm font-medium">
                    <SelectValue placeholder="ประเภทรายการ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-2 border-blue-200">
                    <SelectItem value="all" className="text-lg font-medium py-3">ทุกประเภท</SelectItem>
                    <SelectItem value="in" className="text-lg font-medium py-3">รับเข้า</SelectItem>
                    <SelectItem value="out" className="text-lg font-medium py-3">เบิกออก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
          </div>
          
          <CardHeader className="pb-6 relative z-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg -m-6 mb-6 p-6 shadow-lg">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center">
              <TrendingUp className="h-7 w-7 mr-3 text-blue-200" />
              รายการเคลื่อนไหวสต็อก
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
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">วันที่</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">สินค้า</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 hidden sm:table-cell text-blue-800">SKU</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">ประเภท</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 text-blue-800">จำนวน</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 hidden md:table-cell text-blue-800">เหตุผล</TableHead>
                      <TableHead className="text-base sm:text-lg font-bold py-4 hidden lg:table-cell text-blue-800">เลขที่อ้างอิง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-lg font-medium bg-gray-50/50">
                          ไม่พบข้อมูลการเคลื่อนไหวสต็อกที่ตรงกับการค้นหา
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((movement, index) => (
                        <TableRow 
                          key={movement.id}
                          className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white/40' : 'bg-blue-50/20'
                          }`}
                        >
                          <TableCell className="font-bold text-base sm:text-lg py-4">
                            <div className="flex flex-col">
                              <span>{new Date(movement.created_at).toLocaleDateString('th-TH')}</span>
                              <span className="text-xs text-muted-foreground sm:hidden">
                                {movement.product_sku}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-base sm:text-lg py-4">
                            <div className="max-w-[200px] truncate" title={movement.product_name}>
                              {movement.product_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-base sm:text-lg hidden sm:table-cell py-4">
                            {movement.product_sku}
                          </TableCell>
                          <TableCell className="text-base sm:text-lg py-4">
                            <Badge 
                              variant={movement.type === 'in' ? 'default' : 'secondary'}
                              className={`text-base font-bold px-4 py-2 ${movement.type === 'in' 
                                ? 'bg-green-500/10 text-green-600' 
                                : 'bg-red-500/10 text-red-600'
                              }`}
                            >
                              <div className="flex items-center">
                                {movement.type === 'in' ? (
                                  <ArrowUp className="mr-2 h-4 w-4" />
                                ) : (
                                  <ArrowDown className="mr-2 h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">
                                  {movement.type === 'in' ? 'รับเข้า' : 'เบิกออก'}
                                </span>
                                <span className="sm:hidden">
                                  {movement.type === 'in' ? '+' : '-'}
                                </span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-base sm:text-lg py-4">
                            <span className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                              {movement.type === 'in' ? '+' : '-'}{movement.quantity.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-base sm:text-lg hidden md:table-cell py-4">
                            <div className="max-w-[150px] truncate" title={movement.reason}>
                              {movement.reason || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-base sm:text-lg hidden lg:table-cell py-4">
                            {movement.reference || '-'}
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
    </Layout>
  );
}
