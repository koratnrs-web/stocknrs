
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Bell, Database, Shield, Palette, Upload, Download, Trash2, Settings as SettingsIcon, Package, LogOut, Key, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { supabase } from '@/lib/supabase';
import { useStock } from '@/contexts/StockContext';
// Removed: import { useAuth } from '@/contexts/AuthContext';
import { exportDataToJSON, exportDataToCSV, parseJSONFile, parseCSVFile, ExportData, generateProductTemplate, generateCategoryTemplate, generateSupplierTemplate } from '@/utils/dataExport';
import { 
  loadSettingsFromDB, 
  saveSettingsToDB, 
  saveRequestersToDB, 
  importDataToDB, 
  deleteAllDataFromDB, 
  testServerConnection,
  testDatabaseConnection,
  testEmailServerConnection,
  SettingsData 
} from '@/lib/settingsService';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'ชื่อบริษัทจำเป็นต้องระบุ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().min(1, 'เบอร์โทรศัพท์จำเป็นต้องระบุ'),
  address: z.string().min(1, 'ที่อยู่จำเป็นต้องระบุ'),
  // Approval settings
  requesters: z.array(z.object({
    name: z.string().min(1, 'ชื่อผู้ขอจำเป็นต้องระบุ'),
    email: z.string().email('รูปแบบอีเมลผู้ขอไม่ถูกต้อง'),
    department: z.string().optional()
  })).min(1, 'ต้องมีผู้ขออย่างน้อย 1 คน'),
  approverName: z.string().min(1, 'ชื่อผู้อนุมัติจำเป็นต้องระบุ'),
  approverEmail: z.string().email('รูปแบบอีเมลผู้อนุมัติไม่ถูกต้อง'),
  ccEmails: z.string().optional(),
  lowStockAlert: z.boolean(),
  emailNotifications: z.boolean(),
  autoBackup: z.boolean(),
  currency: z.enum(['THB', 'USD', 'EUR']),
  // Server connection settings
  serverHost: z.string().min(1, 'Host เซิร์ฟเวอร์จำเป็นต้องระบุ'),
  serverPort: z.string().min(1, 'Port เซิร์ฟเวอร์จำเป็นต้องระบุ'),
  databaseHost: z.string().min(1, 'Host ฐานข้อมูลจำเป็นต้องระบุ'),
  databasePort: z.string().min(1, 'Port ฐานข้อมูลจำเป็นต้องระบุ'),
  databaseName: z.string().min(1, 'ชื่อฐานข้อมูลจำเป็นต้องระบุ'),
  databaseUser: z.string().min(1, 'ผู้ใช้ฐานข้อมูลจำเป็นต้องระบุ'),
  // Email server settings
  emailServerHost: z.string().min(1, 'Host เซิร์ฟเวอร์อีเมลจำเป็นต้องระบุ'),
  emailServerPort: z.string().min(1, 'Port เซิร์ฟเวอร์อีเมลจำเป็นต้องระบุ'),
  emailServerType: z.enum(['postfix', 'smtp', 'gmail', 'outlook']),
  emailUsername: z.string().optional(),
  emailPassword: z.string().optional(),
  emailEncryption: z.enum(['none', 'ssl', 'tls']),
  emailAuthRequired: z.boolean()
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { getStockLevel } = useStock();
  // Removed: const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load settings from database
  const loadSettings = async (): Promise<SettingsFormData> => {
    try {
      const dbSettings = await loadSettingsFromDB();
      
      // Convert database format to form format
      return {
        companyName: dbSettings.companyName,
        email: dbSettings.email,
        phone: dbSettings.phone,
        address: dbSettings.address,
        currency: dbSettings.currency as 'THB' | 'USD' | 'EUR',
        approverName: dbSettings.approverName,
        approverEmail: dbSettings.approverEmail,
        ccEmails: dbSettings.ccEmails,
        lowStockAlert: dbSettings.lowStockAlert,
        emailNotifications: dbSettings.emailNotifications,
        autoBackup: dbSettings.autoBackup,
        requesters: dbSettings.requesters.map(r => ({
          name: r.name,
          email: r.email,
          department: r.department || ''
        })),
        // Server connection settings
        serverHost: dbSettings.serverHost,
        serverPort: dbSettings.serverPort,
        databaseHost: dbSettings.databaseHost,
        databasePort: dbSettings.databasePort,
        databaseName: dbSettings.databaseName,
        databaseUser: dbSettings.databaseUser,
        // Email server settings
        emailServerHost: dbSettings.emailServerHost,
        emailServerPort: dbSettings.emailServerPort,
        emailServerType: dbSettings.emailServerType,
        emailUsername: dbSettings.emailUsername,
        emailPassword: dbSettings.emailPassword,
        emailEncryption: dbSettings.emailEncryption,
        emailAuthRequired: dbSettings.emailAuthRequired
      };
      } catch (error) {
      console.error('Error loading settings from database:', error);
      // Return default values if database fails
    return {
      companyName: 'StockFlow Inc.',
      email: 'admin@stockflow.com',
      phone: '+66 123 456 789',
      address: '123 Business Street, Bangkok, Thailand',
        currency: 'THB',
        approverName: 'ผู้อนุมัติงบประมาณ',
        approverEmail: 'approver@stockflow.com',
        ccEmails: 'finance@stockflow.com,manager@stockflow.com',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
        requesters: [
          {
            name: 'ผู้ขอใช้งบประมาณ',
            email: 'requester@stockflow.com',
            department: 'ทั่วไป'
          }
        ],
        // Server connection settings
        serverHost: 'localhost',
        serverPort: '3000',
        databaseHost: 'localhost',
        databasePort: '5432',
        databaseName: 'stockflow',
        databaseUser: 'postgres',
        // Email server settings
        emailServerHost: 'localhost',
        emailServerPort: '587',
        emailServerType: 'postfix',
        emailUsername: '',
        emailPassword: '',
        emailEncryption: 'tls',
        emailAuthRequired: true
      };
    }
  };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: 'StockFlow Inc.',
      email: 'admin@stockflow.com',
      phone: '+66 123 456 789',
      address: '123 Business Street, Bangkok, Thailand',
      currency: 'THB',
      approverName: 'ผู้อนุมัติงบประมาณ',
      approverEmail: 'approver@stockflow.com',
      ccEmails: 'finance@stockflow.com,manager@stockflow.com',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
      requesters: [
        {
          name: 'ผู้ขอใช้งบประมาณ',
          email: 'requester@stockflow.com',
          department: 'ทั่วไป'
        }
      ]
    }
  });

  // Load settings from database on component mount
  useEffect(() => {
    const initializeSettings = async () => {
      const settings = await loadSettings();
      form.reset(settings);
    };
    
    initializeSettings();
  }, [form]);

  // Connection test functions
  const testServerConnectionHandler = async () => {
    const settings = form.getValues();
    setIsLoading(true);
    try {
      const result = await testServerConnection(settings.serverHost, settings.serverPort);
      toast({
        title: result.success ? "✅ เชื่อมต่อสำเร็จ" : "❌ เชื่อมต่อไม่สำเร็จ",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบการเชื่อมต่อได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseConnectionHandler = async () => {
    const settings = form.getValues();
    setIsLoading(true);
    try {
      const result = await testDatabaseConnection(
        settings.databaseHost, 
        settings.databasePort, 
        settings.databaseName, 
        settings.databaseUser
      );
      toast({
        title: result.success ? "✅ เชื่อมต่อสำเร็จ" : "❌ เชื่อมต่อไม่สำเร็จ",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบการเชื่อมต่อได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailConnectionHandler = async () => {
    const settings = form.getValues();
    setIsLoading(true);
    try {
      const result = await testEmailServerConnection(
        settings.emailServerHost,
        settings.emailServerPort,
        settings.emailServerType,
        settings.emailUsername || '',
        settings.emailPassword || '',
        settings.emailEncryption,
        settings.emailAuthRequired
      );
      toast({
        title: result.success ? "✅ เชื่อมต่อสำเร็จ" : "❌ เชื่อมต่อไม่สำเร็จ",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบการเชื่อมต่อได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove this useEffect since we're not using products from context anymore

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      // Save settings to database
      const settingsSuccess = await saveSettingsToDB({
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        currency: data.currency,
        approverName: data.approverName,
        approverEmail: data.approverEmail,
        ccEmails: data.ccEmails,
        lowStockAlert: data.lowStockAlert,
        emailNotifications: data.emailNotifications,
        autoBackup: data.autoBackup,
        // Server connection settings
        serverHost: data.serverHost,
        serverPort: data.serverPort,
        databaseHost: data.databaseHost,
        databasePort: data.databasePort,
        databaseName: data.databaseName,
        databaseUser: data.databaseUser,
        // Email server settings
        emailServerHost: data.emailServerHost,
        emailServerPort: data.emailServerPort,
        emailServerType: data.emailServerType,
        emailUsername: data.emailUsername,
        emailPassword: data.emailPassword,
        emailEncryption: data.emailEncryption,
        emailAuthRequired: data.emailAuthRequired
      });

      // Save requesters to database
      const requestersSuccess = await saveRequestersToDB(
        data.requesters.map(r => ({
          name: r.name,
          email: r.email,
          department: r.department,
          is_active: true
        }))
      );

      if (settingsSuccess && requestersSuccess) {
      toast({
        title: "สำเร็จ",
        description: "บันทึกการตั้งค่าเรียบร้อยแล้ว",
      });
      } else {
        throw new Error('ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = async () => {
    try {
      const settings = await loadSettings();
      form.reset(settings);
    toast({
      title: "ยกเลิกแล้ว",
      description: "ยกเลิกการเปลี่ยนแปลง",
    });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดการตั้งค่าได้",
        variant: "destructive",
      });
    }
  };

  // Export functions - these now work with real database data
  const handleExportJSON = async () => {
    try {
      // Fetch real data from database
      const { data: products } = await supabase.from('products').select('*');
      const { data: categories } = await supabase.from('categories').select('*');
      const { data: suppliers } = await supabase.from('suppliers').select('*');
      const { data: movements } = await supabase.from('stock_movements').select('*');

      const exportData = {
        products: products || [],
        categories: categories || [],
        suppliers: suppliers || [],
        movements: movements || [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      exportDataToJSON(exportData);
      toast({
        title: "ส่งออกเรียบร้อย",
        description: "ส่งออกข้อมูล JSON เรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      // Fetch real data from database
      const { data: products } = await supabase.from('products').select('*');
      const { data: categories } = await supabase.from('categories').select('*');
      const { data: suppliers } = await supabase.from('suppliers').select('*');
      const { data: movements } = await supabase.from('stock_movements').select('*');

      const exportData = {
        products: products || [],
        categories: categories || [],
        suppliers: suppliers || [],
        movements: movements || [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      exportDataToCSV(exportData);
      toast({
        title: "ส่งออกเรียบร้อย", 
        description: "ส่งออกข้อมูล CSV เรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  // Import functions
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let data;
      if (file.name.endsWith('.json')) {
        data = await parseJSONFile(file);
      } else if (file.name.endsWith('.csv')) {
        data = await parseCSVFile(file);
      } else {
        toast({
          title: "รูปแบบไฟล์ไม่ถูกต้อง",
          description: "รองรับเฉพาะ .json และ .csv",
          variant: "destructive",
        });
        return;
      }

      // Import data to database
      const result = await importDataToDB(data);
      
      if (result.success) {
        toast({
          title: "นำเข้าเรียบร้อย",
          description: result.message,
        });
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAllData = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      setIsLoading(true);
      try {
        const success = await deleteAllDataFromDB();
        
        if (success) {
      toast({
        title: "ลบเรียบร้อย",
            description: "ลบข้อมูลทั้งหมดจากฐานข้อมูลเรียบร้อยแล้ว",
      });
          // Refresh the page to reflect changes
      window.location.reload();
        } else {
          throw new Error('ไม่สามารถลบข้อมูลได้');
        }
      } catch (error) {
        console.error('Error deleting data:', error);
        toast({
          title: "ข้อผิดพลาด",
          description: "เกิดข้อผิดพลาดในการลบข้อมูล",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Template functions
  const handleDownloadProductTemplate = () => {
    generateProductTemplate();
    toast({
      title: "ดาวน์โหลดเรียบร้อย",
      description: "ดาวน์โหลด Template สินค้าเรียบร้อยแล้ว",
    });
  };

  const handleDownloadCategoryTemplate = () => {
    generateCategoryTemplate();
    toast({
      title: "ดาวน์โหลดเรียบร้อย",
      description: "ดาวน์โหลด Template หมวดหมู่เรียบร้อยแล้ว",
    });
  };

  const handleDownloadSupplierTemplate = () => {
    generateSupplierTemplate();
    toast({
      title: "ดาวน์โหลดเรียบร้อย",
      description: "ดาวน์โหลด Template ซัพพลายเออร์เรียบร้อยแล้ว",
    });
  };

  // Notification functions
  const checkLowStockAlerts = async () => {
    const settings = form.getValues();
    if (!settings.lowStockAlert) return;

    try {
      const { data: products } = await supabase.from('products').select('*');
      const lowStockItems = (products || []).filter(product => {
        return product.current_stock <= product.min_stock;
      });

      if (lowStockItems.length > 0) {
        toast({
          title: "🔔 แจ้งเตือนสต็อกต่ำ",
          description: `พบสินค้า ${lowStockItems.length} รายการที่ต้องการเติมสต็อก`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ สต็อกปกติ",
          description: "ไม่มีสินค้าที่สต็อกต่ำในขณะนี้",
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบสต็อกได้",
        variant: "destructive",
      });
    }
  };

  const testEmailNotification = () => {
    const settings = form.getValues();
    if (settings.emailNotifications) {
      toast({
        title: "📧 ทดสอบการแจ้งเตือน",
        description: `ส่งอีเมลทดสอบไปยัง ${settings.email} แล้ว`,
      });
    } else {
      toast({
        title: "การแจ้งเตือนปิดอยู่",
        description: "กรุณาเปิดการแจ้งเตือนทางอีเมลก่อน",
        variant: "destructive",
      });
    }
  };

  // Password management functions
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // จำลองการเปลี่ยนรหัสผ่าน (ในอนาคตจะเชื่อมต่อกับ backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "สำเร็จ",
        description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
      });

      // รีเซ็ตฟอร์มรหัสผ่าน
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Removed: Logout functions - no longer needed without authentication
  // const handleLogout = () => { ... };
  // const handleLogoutAllDevices = () => { ... };

  // Requester management functions
  const addRequester = () => {
    const currentRequesters = form.getValues('requesters');
    form.setValue('requesters', [
      ...currentRequesters,
      { name: '', email: '', department: '' }
    ]);
  };

  const removeRequester = (index: number) => {
    const currentRequesters = form.getValues('requesters');
    if (currentRequesters.length > 1) {
      form.setValue('requesters', currentRequesters.filter((_, i) => i !== index));
    }
  };

  const updateRequester = (index: number, field: 'name' | 'email' | 'department', value: string) => {
    const currentRequesters = form.getValues('requesters');
    const updatedRequesters = [...currentRequesters];
    updatedRequesters[index] = { ...updatedRequesters[index], [field]: value };
    form.setValue('requesters', updatedRequesters);
  };

  return (
    <Layout hideHeader={true}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8 pb-8">
          {/* Professional Page Header */}
          <PageHeader 
            title="การตั้งค่า"
            description="จัดการการตั้งค่าระบบและการกำหนดค่าต่างๆ"
            icon={SettingsIcon}
            stats={[
              {
                label: "ผู้ใช้ปัจจุบัน", 
                value: 'ผู้ดูแลระบบ',
                icon: User,
                trend: {
                  value: "ออนไลน์",
                  isPositive: true
                }
              },
              {
                label: "สถานะระบบ", 
                value: "พร้อมใช้งาน",
                icon: Package,
                trend: {
                  value: "ปกติ",
                  isPositive: true
                }
              },
              {
                label: "การแจ้งเตือน",
                value: "เปิดใช้งาน",
                icon: Bell,
                trend: {
                  value: "เปิด",
                  isPositive: true
                }
              },
              {
                label: "การเชื่อมต่อ",
                value: "เสถียร",
                icon: Database,
                trend: {
                  value: "ดี",
                  isPositive: true
                }
              }
            ]}
          />

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl shadow-inner border border-gray-200">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-100 transition-all duration-200 rounded-md"
              >
                <User className="mr-2 h-4 w-4" />
                ทั่วไป
              </TabsTrigger>
              <TabsTrigger 
                value="approval" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-md"
              >
                <Shield className="mr-2 h-4 w-4" />
                การอนุมัติ
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-100 transition-all duration-200 rounded-md"
              >
                <Bell className="mr-2 h-4 w-4" />
                การแจ้งเตือน
              </TabsTrigger>
              <TabsTrigger 
                value="connections" 
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-100 transition-all duration-200 rounded-md"
              >
                <Database className="mr-2 h-4 w-4" />
                การเชื่อมต่อ
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-indigo-100 transition-all duration-200 rounded-md"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                ระบบ
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-100 transition-all duration-200 rounded-md"
              >
                <Key className="mr-2 h-4 w-4" />
                ความปลอดภัย
              </TabsTrigger>
            </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-l-4 border-l-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="flex items-center text-blue-800">
                  <User className="mr-2 h-5 w-5" />
                  ข้อมูลบริษัท
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อบริษัท</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สกุลเงิน</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            
          </TabsContent>

          <TabsContent value="approval" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-l-4 border-l-green-500">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <CardTitle className="flex items-center text-green-800">
                  <User className="mr-2 h-5 w-5" />
                  การตั้งค่าการอนุมัติ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Requesters Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">รายชื่อผู้ขอ</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addRequester}
                      className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      + เพิ่มผู้ขอ
                    </Button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="requesters"
                    render={() => (
                      <FormItem>
                        <div className="space-y-4">
                          {form.watch('requesters').map((requester, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-muted/30">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-sm">ผู้ขอ #{index + 1}</h5>
                                {form.watch('requesters').length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeRequester(index)}
                                    className="text-destructive hover:text-destructive-foreground"
                                  >
                                    ลบ
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label>ชื่อผู้ขอ</Label>
                                  <Input
                                    value={requester.name}
                                    onChange={(e) => updateRequester(index, 'name', e.target.value)}
                                    placeholder="ชื่อผู้ขอ"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>อีเมล</Label>
                                  <Input
                                    type="email"
                                    value={requester.email}
                                    onChange={(e) => updateRequester(index, 'email', e.target.value)}
                                    placeholder="อีเมลผู้ขอ"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>แผนก/ฝ่าย</Label>
                                  <Input
                                    value={requester.department || ''}
                                    onChange={(e) => updateRequester(index, 'department', e.target.value)}
                                    placeholder="แผนก/ฝ่าย (ไม่บังคับ)"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Approver Section */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-foreground">ผู้อนุมัติ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="approverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อผู้อนุมัติ</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ชื่อผู้อนุมัติ" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="approverEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>อีเมลผู้อนุมัติ</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} placeholder="อีเมลผู้อนุมัติ" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* CC Emails Section */}
                <div className="space-y-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="ccEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมลที่ CC (คั่นด้วยเครื่องหมายจุลภาค)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="finance@company.com, manager@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          อีเมลที่จะได้รับสำเนาการอนุมัติทั้งหมด (คั่นด้วยเครื่องหมายจุลภาค)
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
                     </TabsContent>

           <TabsContent value="connections" className="space-y-6">
             {/* Server Connection Settings */}
             <Card className="bg-gradient-card shadow-card border-l-4 border-l-purple-500">
               <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                 <CardTitle className="flex items-center text-purple-800">
                   <Database className="mr-2 h-5 w-5" />
                   การตั้งค่าเซิร์ฟเวอร์
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                     name="serverHost"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Host เซิร์ฟเวอร์</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="localhost" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="serverPort"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Port เซิร์ฟเวอร์</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="3000" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
                 
                 <div className="flex justify-end">
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={testServerConnectionHandler}
                     disabled={isLoading}
                     className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                   >
                     🔍 ทดสอบการเชื่อมต่อ
                   </Button>
                 </div>
               </CardContent>
             </Card>

             {/* Database Connection Settings */}
             <Card className="bg-gradient-card shadow-card border-l-4 border-l-purple-500">
               <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                 <CardTitle className="flex items-center text-purple-800">
                   <Database className="mr-2 h-5 w-5" />
                   การตั้งค่าฐานข้อมูล
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="databaseHost"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Host ฐานข้อมูล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="localhost" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="databasePort"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Port ฐานข้อมูล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="5432" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="databaseName"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>ชื่อฐานข้อมูล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="stockflow" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="databaseUser"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>ผู้ใช้ฐานข้อมูล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="postgres" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
                 
                 <div className="flex justify-end">
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={testDatabaseConnectionHandler}
                     disabled={isLoading}
                     className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                   >
                     🔍 ทดสอบการเชื่อมต่อ
                   </Button>
                 </div>
               </CardContent>
             </Card>

             {/* Email Server Settings */}
             <Card className="bg-gradient-card shadow-card border-l-4 border-l-purple-500">
               <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                 <CardTitle className="flex items-center text-purple-800">
                   <Bell className="mr-2 h-5 w-5" />
                   การตั้งค่าเซิร์ฟเวอร์อีเมล
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="emailServerType"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>ประเภทเซิร์ฟเวอร์</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="postfix">Postfix + Dovecot</SelectItem>
                             <SelectItem value="smtp">SMTP ทั่วไป</SelectItem>
                             <SelectItem value="gmail">Gmail</SelectItem>
                             <SelectItem value="outlook">Outlook</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                     name="emailServerHost"
                    render={({ field }) => (
                      <FormItem>
                         <FormLabel>Host เซิร์ฟเวอร์อีเมล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="localhost" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="emailServerPort"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Port เซิร์ฟเวอร์อีเมล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="587" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="emailEncryption"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>การเข้ารหัส</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="none">ไม่เข้ารหัส</SelectItem>
                             <SelectItem value="ssl">SSL</SelectItem>
                             <SelectItem value="tls">TLS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                     control={form.control}
                     name="emailUsername"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>ชื่อผู้ใช้อีเมล</FormLabel>
                         <FormControl>
                           <Input {...field} placeholder="user@domain.com" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="emailPassword"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>รหัสผ่านอีเมล</FormLabel>
                         <FormControl>
                           <Input type="password" {...field} placeholder="รหัสผ่าน" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
                 
                 <FormField
                   control={form.control}
                   name="emailAuthRequired"
                   render={({ field }) => (
                     <div className="flex items-center justify-between">
                       <div>
                         <h4 className="font-medium text-foreground">ต้องการการยืนยันตัวตน</h4>
                         <p className="text-sm text-muted-foreground">เปิดใช้งานการยืนยันตัวตนสำหรับเซิร์ฟเวอร์อีเมล</p>
                       </div>
                       <Switch
                         checked={field.value}
                         onCheckedChange={field.onChange}
                       />
                     </div>
                   )}
                 />
                 
                 <div className="flex justify-end">
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={testEmailConnectionHandler}
                     disabled={isLoading}
                     className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                   >
                     🔍 ทดสอบการเชื่อมต่อ
                   </Button>
                 </div>
                 
                 <div className="p-4 bg-blue-50 rounded-lg">
                   <h4 className="font-medium text-blue-800 mb-2">💡 ข้อมูลสำหรับ Postfix + Dovecot</h4>
                   <div className="text-sm text-blue-700 space-y-1">
                     <p>• <strong>Host:</strong> localhost หรือ IP ของเซิร์ฟเวอร์</p>
                     <p>• <strong>Port:</strong> 587 (SMTP) หรือ 465 (SMTPS)</p>
                     <p>• <strong>การเข้ารหัส:</strong> TLS (แนะนำ) หรือ SSL</p>
                     <p>• <strong>การยืนยันตัวตน:</strong> เปิดใช้งาน (หากเซิร์ฟเวอร์ต้องการ)</p>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-l-4 border-l-orange-500">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                <CardTitle className="flex items-center text-orange-800">
                  <Bell className="mr-2 h-5 w-5" />
                  การตั้งค่าการแจ้งเตือน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="lowStockAlert"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">แจ้งเตือนสต็อกต่ำ</h4>
                        <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อสินค้าใกล้หมด</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">การแจ้งเตือนทางอีเมล</h4>
                        <p className="text-sm text-muted-foreground">รับข้อมูลอัพเดทสำคัญทางอีเมล</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">ทดสอบการแจ้งเตือน</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={checkLowStockAlerts}
                      className="justify-start border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      ตรวจสอบสต็อกต่ำ
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={testEmailNotification}
                      className="justify-start border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    >
                      📧 ทดสอบอีเมล
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-l-4 border-l-indigo-500">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
                <CardTitle className="flex items-center text-indigo-800">
                  <Database className="mr-2 h-5 w-5" />
                  การตั้งค่าระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="autoBackup"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">การสำรองข้อมูลอัตโนมัติ</h4>
                        <p className="text-sm text-muted-foreground">สำรองข้อมูลอัตโนมัติทุกวัน</p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">การจัดการข้อมูล</h4>
                  <p className="text-sm text-muted-foreground">
                    ส่งออกหรือนำเข้าข้อมูลสินค้า หมวดหมู่ และซัพพลายเออร์
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">ส่งออกข้อมูล</h5>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleExportJSON}
                          className="justify-start border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                          disabled={isLoading}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          ส่งออก JSON
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleExportCSV}
                          className="justify-start border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                          disabled={isLoading}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          ส่งออก CSV
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">นำเข้าข้อมูล</h5>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline"
                          onClick={handleImportClick}
                          className="justify-start border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                          disabled={isLoading}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          นำเข้าไฟล์
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json,.csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleDeleteAllData}
                          className="justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive border-red-500"
                          disabled={isLoading}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          ลบข้อมูลทั้งหมด
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>• รองรับไฟล์ JSON และ CSV</p>
                    <p>• การลบข้อมูลจะไม่สามารถยกเลิกได้</p>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-foreground">Template การนำเข้าข้อมูล</h4>
                  <p className="text-sm text-muted-foreground">
                    ดาวน์โหลด Template CSV สำหรับการนำเข้าข้อมูล
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleDownloadProductTemplate}
                      className="justify-start border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template สินค้า
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleDownloadCategoryTemplate}
                      className="justify-start border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template หมวดหมู่
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleDownloadSupplierTemplate}
                      className="justify-start border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template ซัพพลายเออร์
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>• Template มีข้อมูลตัวอย่างและรูปแบบที่ถูกต้อง</p>
                    <p>• แก้ไขข้อมูลใน Template แล้วนำเข้ากลับเข้าระบบ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gradient-card shadow-card border-l-4 border-l-red-500">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <CardTitle className="flex items-center text-red-800">
                  <Shield className="mr-2 h-5 w-5" />
                  การตั้งค่าความปลอดภัย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">เปลี่ยนรหัสผ่าน</h4>
                  <div className="grid grid-cols-1 gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                      <div className="relative">
                        <Input 
                          id="currentPassword" 
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="กรอกรหัสผ่านปัจจุบัน"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                      <div className="relative">
                        <Input 
                          id="newPassword" 
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                      <div className="relative">
                        <Input 
                          id="confirmPassword" 
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                    </div>
                    </div>
                    <Button 
                      className="w-fit bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleChangePassword}
                      disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      {isLoading ? 'กำลังอัพเดท...' : 'อัพเดทรหัสผ่าน'}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">การจัดการเซสชัน</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Removed: Logout buttons - no longer needed without authentication */}
                    <div className="text-sm text-gray-500 italic">
                      ระบบไม่ต้องการการยืนยันตัวตน
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-foreground">ข้อมูลผู้ใช้</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ชื่อผู้ใช้</Label>
                      <Input value="ผู้ดูแลระบบ" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>บทบาท</Label>
                      <Input value="ผู้จัดการสต็อก" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>สถานะระบบ</Label>
                      <Input value="พร้อมใช้งาน" disabled />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={resetForm} className="border-gray-500 text-gray-600 hover:bg-gray-50 hover:text-gray-700">
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </form>
      </Form>
    </Layout>
  );
}
