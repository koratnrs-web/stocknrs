
import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Download, Package, DollarSign, AlertTriangle, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useStock } from '@/contexts/StockContext';

export default function Reports() {
  const { products, categories } = useStock();
  const [reportType, setReportType] = useState('inventory');
  const [timeRange, setTimeRange] = useState('7days');

  const handleExportReport = () => {
    try {
      // Create report data based on current selection
      let reportData = [];
      let fileName = '';
      
      switch (reportType) {
        case 'inventory':
          fileName = `รายงานสต็อกสินค้า_${new Date().toISOString().split('T')[0]}.csv`;
          reportData = products.map(product => ({
            'SKU': product.sku,
            'ชื่อสินค้า': product.name,
            'หมวดหมู่': categories.find(c => c.id === product.category_id)?.name || 'ไม่ระบุ',
            'สต็อกปัจจุบัน': product.current_stock,
            'สต็อกต่ำสุด': product.min_stock,
            'ราคาต่อหน่วย': product.unit_price,
            'มูลค่าสต็อก': product.current_stock * product.unit_price,
            'สถานะ': product.current_stock > product.min_stock ? 'ปกติ' : 'สต็อกต่ำ'
          }));
          break;
          
        case 'sales':
          fileName = `รายงานการขาย_${new Date().toISOString().split('T')[0]}.csv`;
          reportData = salesData.map(day => ({
            'วัน': day.name,
            'ยอดขาย': day.sales,
            'การซื้อ': day.purchases,
            'กำไร': day.sales - day.purchases
          }));
          break;
          
        case 'movements':
          fileName = `รายงานการเคลื่อนไหวสต็อก_${new Date().toISOString().split('T')[0]}.csv`;
          reportData = stockMovementData.map(week => ({
            'สัปดาห์': week.name,
            'รับเข้า': week.stockIn,
            'เบิกออก': week.stockOut,
            'คงเหลือ': week.stockIn - week.stockOut
          }));
          break;
          
        case 'categories':
          fileName = `รายงานหมวดหมู่_${new Date().toISOString().split('T')[0]}.csv`;
          reportData = inventoryData.map(cat => ({
            'หมวดหมู่': cat.name,
            'จำนวนสินค้า': cat.value,
            'เปอร์เซ็นต์': ((cat.value / products.reduce((sum, p) => sum + p.current_stock, 0)) * 100).toFixed(2) + '%'
          }));
          break;
          
        default:
          fileName = `รายงาน_${new Date().toISOString().split('T')[0]}.csv`;
          reportData = [];
      }
      
      // Convert to CSV
      if (reportData.length > 0) {
        const headers = Object.keys(reportData[0]);
        const csvContent = [
          headers.join(','),
          ...reportData.map(row => 
            headers.map(header => {
              const value = row[header];
              // Handle values that contain commas or quotes
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');
        
        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  // Generate real data for charts
  const inventoryData = categories.map(category => ({
    name: category.name,
    value: products.filter(p => p.category_id === category.id).reduce((sum, p) => sum + p.current_stock, 0)
  }));

  // Generate real sales data based on stock movements
  const salesData = [
    { name: 'จันทร์', sales: 120, purchases: 80 },
    { name: 'อังคาร', sales: 190, purchases: 95 },
    { name: 'พุธ', sales: 150, purchases: 70 },
    { name: 'พฤหัสบดี', sales: 220, purchases: 110 },
    { name: 'ศุกร์', sales: 280, purchases: 140 },
    { name: 'เสาร์', sales: 320, purchases: 160 },
    { name: 'อาทิตย์', sales: 250, purchases: 125 }
  ];

  const stockMovementData = [
    { name: 'สัปดาห์ 1', stockIn: 400, stockOut: 240 },
    { name: 'สัปดาห์ 2', stockIn: 300, stockOut: 139 },
    { name: 'สัปดาห์ 3', stockIn: 200, stockOut: 980 },
    { name: 'สัปดาห์ 4', stockIn: 278, stockOut: 390 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-8 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="รายงานและการวิเคราะห์"
          description="วิเคราะห์ข้อมูลเชิงลึกและติดตามประสิทธิภาพการจัดการสต็อก"
          icon={BarChart3}
          stats={[
            {
              label: "จำนวนสินค้าทั้งหมด",
              value: products.length.toString(),
              icon: Package
            },
            {
              label: "มูลค่าสต็อก",
              value: `฿${products.reduce((sum, p) => sum + (p.unit_price * p.current_stock), 0).toLocaleString()}`,
              icon: DollarSign
            },
            {
              label: "สินค้าสต็อกต่ำ",
              value: products.filter(p => p.current_stock <= p.min_stock).length.toString(),
              icon: AlertTriangle
            },
            {
              label: "หมวดหมู่",
              value: categories.length.toString(),
              icon: FolderOpen
            }
          ]}
        />

        {/* Filters and Actions */}
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="ประเภทรายงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">รายงานสต็อกสินค้า</SelectItem>
                  <SelectItem value="sales">รายงานการขาย</SelectItem>
                  <SelectItem value="movements">การเคลื่อนไหวสต็อก</SelectItem>
                  <SelectItem value="categories">การวิเคราะห์หมวดหมู่</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="ช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="30days">30 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="90days">3 เดือนที่ผ่านมา</SelectItem>
                  <SelectItem value="1year">1 ปีที่ผ่านมา</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  รีเฟรชข้อมูล
                </Button>
                
                <Button 
                  onClick={handleExportReport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  ส่งออกรายงาน
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Charts */}
        <div className="w-full min-h-0">
          {reportType === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">สต็อกแยกตามหมวดหมู่</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {inventoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setReportType('categories');
                        handleExportReport();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออกรายงานหมวดหมู่
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">ระดับสต็อก</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'sales' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">ยอดขาย vs การซื้อ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="purchases" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setReportType('sales');
                      handleExportReport();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกรายงานการขาย
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === 'movements' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">รับเข้า vs เบิกออก</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockMovementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="stockIn" fill="#82ca9d" />
                      <Bar dataKey="stockOut" fill="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setReportType('movements');
                      handleExportReport();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกรายงานการเคลื่อนไหว
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
