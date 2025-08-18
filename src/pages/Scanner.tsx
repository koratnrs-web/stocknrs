
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Search, Package, AlertCircle } from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

interface ProductWithCategory extends Product {
  categories?: { name: string };
  suppliers?: { name: string };
}

export default function Scanner() {
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<ProductWithCategory | null>(null);
  const [recentScans, setRecentScans] = useState<ProductWithCategory[]>([]);
  const { toast } = useToast();

  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      setBarcode(scannedCode);
      handleScan(scannedCode);
    },
    minLength: 3,
    timeout: 100
  });

  const searchProductByBarcode = async (barcodeValue: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          suppliers(name)
        `)
        .eq('sku', barcodeValue)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error searching product:', error);
      return null;
    }
  };

  const handleScan = async (barcodeValue?: string) => {
    const codeToScan = barcodeValue || barcode.trim();
    if (!codeToScan) return;
    
    const product = await searchProductByBarcode(codeToScan);
    setScannedProduct(product);
    
    if (product) {
      // Add to recent scans
      setRecentScans(prev => {
        const filtered = prev.filter(p => p.id !== product.id);
        return [product, ...filtered].slice(0, 5);
      });
      
      toast({
        title: "สินค้าพบแล้ว",
        description: `${product.name} - คงเหลือ ${product.current_stock} ชิ้น`,
      });
    } else {
      toast({
        title: "ไม่พบสินค้า",
        description: `ไม่พบสินค้าที่มี SKU: ${codeToScan}`,
        variant: "destructive",
      });
      
      setTimeout(() => setScannedProduct(null), 3000);
    }
  };

  // Auto-scan when barcode changes from scanner
  useEffect(() => {
    if (lastScannedCode && lastScannedCode !== barcode) {
      setBarcode(lastScannedCode);
    }
  }, [lastScannedCode, barcode]);

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-6 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="สแกนบาร์โค้ด"
          description="ป้อน SKU สินค้าเพื่อค้นหาข้อมูลสต็อกอย่างรวดเร็ว"
          icon={ScanLine}
        />

        {/* Manual Input */}
        <div className="w-full max-w-md mx-auto px-4 sm:px-0">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-lg">ป้อน SKU สินค้า</CardTitle>
              <p className="text-xs text-muted-foreground text-center mt-1">
                รองรับเครื่องอ่านบาร์โค้ด หรือพิมพ์ SKU ด้วยตนเอง
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scanner Status */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">สถานะเครื่องสแกน:</span>
                <BarcodeScannerIndicator isDetected={scannerDetected} />
              </div>
              {scannerDetected && (
                <p className="text-xs text-green-600 text-center">
                  พร้อมใช้งาน - สแกนบาร์โค้ดได้เลย
                </p>
              )}
              
              <div className="flex space-x-2">
                <Input
                  placeholder="ป้อน SKU สินค้า..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  className="text-sm sm:text-base"
                />
                <Button onClick={() => handleScan()} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Result */}
        {scannedProduct && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Package className="mr-2 h-5 w-5" />
                  พบสินค้าแล้ว
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ชื่อสินค้า</label>
                      <p className="text-lg sm:text-xl font-semibold text-foreground break-words">{scannedProduct.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SKU</label>
                      <p className="text-sm sm:text-base text-foreground break-all">{scannedProduct.sku}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">หมวดหมู่</label>
                      <p className="text-sm sm:text-base text-foreground">{scannedProduct.categories?.name || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">สต็อกปัจจุบัน</label>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">{scannedProduct.current_stock.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ราคาต่อหน่วย</label>
                      <p className="text-lg sm:text-xl font-semibold text-foreground">฿{scannedProduct.unit_price.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">สถานะสต็อก</label>
                      <div>
                        <Badge 
                          variant={scannedProduct.current_stock > scannedProduct.min_stock ? 'default' : scannedProduct.current_stock > 0 ? 'secondary' : 'destructive'}
                          className={`text-xs sm:text-sm ${
                            scannedProduct.current_stock > scannedProduct.min_stock
                              ? 'bg-green-500/10 text-green-600' 
                              : scannedProduct.current_stock > 0
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {scannedProduct.current_stock > scannedProduct.min_stock 
                            ? 'สต็อกเพียงพอ' 
                            : scannedProduct.current_stock > 0 
                              ? 'สต็อกต่ำ' 
                              : 'หมดสต็อก'
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button variant="outline" className="flex-1 text-sm sm:text-base">
                    อัพเดทสต็อก
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm sm:text-base">
                    รายละเอียดเพิ่มเติม
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Not Found */}
        {barcode && scannedProduct === null && barcode.trim() !== '' && (
          <div className="w-full max-w-md mx-auto px-4 sm:px-0">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-foreground font-medium text-sm sm:text-base">ไม่พบสินค้า</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">
                  ไม่พบสินค้าที่มี SKU: {barcode}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 text-sm sm:text-base"
                  onClick={() => {
                    setBarcode('');
                    setScannedProduct(null);
                  }}
                >
                  ลองใหม่
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Scans */}
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">การสแกนล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              {recentScans.length > 0 ? (
                <div className="space-y-3">
                  {recentScans.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(Date.now() - index * 60000).toLocaleTimeString('th-TH')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs sm:text-sm ml-2 flex-shrink-0">{product.sku}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                  ยังไม่มีการสแกนสินค้า
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
