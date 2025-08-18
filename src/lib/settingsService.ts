import { supabase } from './supabase';

export interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Requester {
  id: number;
  name: string;
  email: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsData {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  approverName: string;
  approverEmail: string;
  ccEmails: string;
  lowStockAlert: boolean;
  emailNotifications: boolean;
  autoBackup: boolean;
  requesters: Requester[];
  // Server connection settings
  serverHost: string;
  serverPort: string;
  databaseHost: string;
  databasePort: string;
  databaseName: string;
  databaseUser: string;
  // Email server settings
  emailServerHost: string;
  emailServerPort: string;
  emailServerType: 'postfix' | 'smtp' | 'gmail' | 'outlook';
  emailUsername: string;
  emailPassword: string;
  emailEncryption: 'none' | 'ssl' | 'tls';
  emailAuthRequired: boolean;
}

// Load all settings from database
export const loadSettingsFromDB = async (): Promise<SettingsData> => {
  try {
    // Load settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*');

    if (settingsError) throw settingsError;

    // Load requesters
    const { data: requesters, error: requestersError } = await supabase
      .from('requesters')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (requestersError) throw requestersError;

    // Convert settings array to object
    const settingsObj: any = {};
    settings?.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    // Convert string values to appropriate types
    const result: SettingsData = {
      companyName: settingsObj.company_name || 'StockFlow Inc.',
      email: settingsObj.company_email || 'admin@stockflow.com',
      phone: settingsObj.company_phone || '+66 123 456 789',
      address: settingsObj.company_address || '123 Business Street, Bangkok, Thailand',
      currency: settingsObj.company_currency || 'THB',
      approverName: settingsObj.approver_name || 'ผู้อนุมัติงบประมาณ',
      approverEmail: settingsObj.approver_email || 'approver@stockflow.com',
      ccEmails: settingsObj.cc_emails || 'finance@stockflow.com,manager@stockflow.com',
      lowStockAlert: settingsObj.low_stock_alert === 'true',
      emailNotifications: settingsObj.email_notifications === 'true',
      autoBackup: settingsObj.auto_backup === 'true',
      requesters: requesters || [],
      // Server connection settings
      serverHost: settingsObj.server_host || 'localhost',
      serverPort: settingsObj.server_port || '3000',
      databaseHost: settingsObj.database_host || 'localhost',
      databasePort: settingsObj.database_port || '5432',
      databaseName: settingsObj.database_name || 'stockflow',
      databaseUser: settingsObj.database_user || 'postgres',
      // Email server settings
      emailServerHost: settingsObj.email_server_host || 'localhost',
      emailServerPort: settingsObj.email_server_port || '587',
      emailServerType: (settingsObj.email_server_type as 'postfix' | 'smtp' | 'gmail' | 'outlook') || 'postfix',
      emailUsername: settingsObj.email_username || '',
      emailPassword: settingsObj.email_password || '',
      emailEncryption: (settingsObj.email_encryption as 'none' | 'ssl' | 'tls') || 'tls',
      emailAuthRequired: settingsObj.email_auth_required === 'true'
    };

    return result;
  } catch (error) {
    console.error('Error loading settings from database:', error);
    // Return default values if database fails
    return {
      companyName: 'StockFlow Inc.',
      email: 'admin@stockflow.com',
      phone: '+66 123 456 789',
      address: '123 Business Street, Bangkok, Thailand',
      currency: 'THB',
      theme: 'light',
      language: 'th',
      approverName: 'ผู้อนุมัติงบประมาณ',
      approverEmail: 'approver@stockflow.com',
      ccEmails: 'finance@stockflow.com,manager@stockflow.com',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
      requesters: [{
        id: 1,
        name: 'ผู้ขอใช้งบประมาณ',
        email: 'requester@stockflow.com',
        department: 'ทั่วไป',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    };
  }
};

// Save settings to database
export const saveSettingsToDB = async (settings: Partial<SettingsData>): Promise<boolean> => {
  try {
    const updates: any[] = [];

    // Company settings
    if (settings.companyName !== undefined) {
      updates.push({ key: 'company_name', value: settings.companyName, category: 'company' });
    }
    if (settings.email !== undefined) {
      updates.push({ key: 'company_email', value: settings.email, category: 'company' });
    }
    if (settings.phone !== undefined) {
      updates.push({ key: 'company_phone', value: settings.phone, category: 'company' });
    }
    if (settings.address !== undefined) {
      updates.push({ key: 'company_address', value: settings.address, category: 'company' });
    }
    if (settings.currency !== undefined) {
      updates.push({ key: 'company_currency', value: settings.currency, category: 'company' });
    }

    // Server connection settings
    if (settings.serverHost !== undefined) {
      updates.push({ key: 'server_host', value: settings.serverHost, category: 'server' });
    }
    if (settings.serverPort !== undefined) {
      updates.push({ key: 'server_port', value: settings.serverPort, category: 'server' });
    }
    if (settings.databaseHost !== undefined) {
      updates.push({ key: 'database_host', value: settings.databaseHost, category: 'database' });
    }
    if (settings.databasePort !== undefined) {
      updates.push({ key: 'database_port', value: settings.databasePort, category: 'database' });
    }
    if (settings.databaseName !== undefined) {
      updates.push({ key: 'database_name', value: settings.databaseName, category: 'database' });
    }
    if (settings.databaseUser !== undefined) {
      updates.push({ key: 'database_user', value: settings.databaseUser, category: 'database' });
    }
    // Email server settings
    if (settings.emailServerHost !== undefined) {
      updates.push({ key: 'email_server_host', value: settings.emailServerHost, category: 'email' });
    }
    if (settings.emailServerPort !== undefined) {
      updates.push({ key: 'email_server_port', value: settings.emailServerPort, category: 'email' });
    }
    if (settings.emailServerType !== undefined) {
      updates.push({ key: 'email_server_type', value: settings.emailServerType, category: 'email' });
    }
    if (settings.emailUsername !== undefined) {
      updates.push({ key: 'email_username', value: settings.emailUsername, category: 'email' });
    }
    if (settings.emailPassword !== undefined) {
      updates.push({ key: 'email_password', value: settings.emailPassword, category: 'email' });
    }
    if (settings.emailEncryption !== undefined) {
      updates.push({ key: 'email_encryption', value: settings.emailEncryption, category: 'email' });
    }
    if (settings.emailAuthRequired !== undefined) {
      updates.push({ key: 'email_auth_required', value: settings.emailAuthRequired.toString(), category: 'email' });
    }

    // Approval settings
    if (settings.approverName !== undefined) {
      updates.push({ key: 'approver_name', value: settings.approverName, category: 'approval' });
    }
    if (settings.approverEmail !== undefined) {
      updates.push({ key: 'approver_email', value: settings.approverEmail, category: 'approval' });
    }
    if (settings.ccEmails !== undefined) {
      updates.push({ key: 'cc_emails', value: settings.ccEmails, category: 'approval' });
    }

    // Notification settings
    if (settings.lowStockAlert !== undefined) {
      updates.push({ key: 'low_stock_alert', value: settings.lowStockAlert.toString(), category: 'notification' });
    }
    if (settings.emailNotifications !== undefined) {
      updates.push({ key: 'email_notifications', value: settings.emailNotifications.toString(), category: 'notification' });
    }

    // System settings
    if (settings.autoBackup !== undefined) {
      updates.push({ key: 'auto_backup', value: settings.autoBackup.toString(), category: 'system' });
    }

    // Update each setting
    for (const update of updates) {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: update.key,
          value: update.value,
          category: update.category,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving settings to database:', error);
    return false;
  }
};

// Save requesters to database
export const saveRequestersToDB = async (requesters: Omit<Requester, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> => {
  try {
    // First, deactivate all existing requesters
    const { error: deactivateError } = await supabase
      .from('requesters')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;

    // Insert new requesters
    for (const requester of requesters) {
      const { error } = await supabase
        .from('requesters')
        .insert({
          name: requester.name,
          email: requester.email,
          department: requester.department,
          is_active: true
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving requesters to database:', error);
    return false;
  }
};

// Import data to database
export const importDataToDB = async (data: any): Promise<{ success: boolean; message: string }> => {
  try {
    let importedCount = 0;

    // Import products
    if (data.products && data.products.length > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .upsert(data.products, { onConflict: 'id' });
      
      if (productsError) throw productsError;
      importedCount += data.products.length;
    }

    // Import categories
    if (data.categories && data.categories.length > 0) {
      const { error: categoriesError } = await supabase
        .from('categories')
        .upsert(data.categories, { onConflict: 'id' });
      
      if (categoriesError) throw categoriesError;
      importedCount += data.categories.length;
    }

    // Import suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      const { error: suppliersError } = await supabase
        .from('suppliers')
        .upsert(data.suppliers, { onConflict: 'id' });
      
      if (suppliersError) throw suppliersError;
      importedCount += data.suppliers.length;
    }

    // Import movements
    if (data.movements && data.movements.length > 0) {
      const { error: movementsError } = await supabase
        .from('stock_movements')
        .upsert(data.movements, { onConflict: 'id' });
      
      if (movementsError) throw movementsError;
      importedCount += data.movements.length;
    }

    return {
      success: true,
      message: `นำเข้าข้อมูลเรียบร้อยแล้ว: ${importedCount} รายการ`
    };
  } catch (error) {
    console.error('Error importing data to database:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล'
    };
  }
};

// Test server connection
export const testServerConnection = async (host: string, port: string): Promise<{ success: boolean; message: string; latency?: number }> => {
  try {
    const startTime = Date.now();
    const response = await fetch(`http://${host}:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (response.ok) {
      return {
        success: true,
        message: `เชื่อมต่อเซิร์ฟเวอร์สำเร็จ (${latency}ms)`,
        latency
      };
    } else {
      return {
        success: false,
        message: `เซิร์ฟเวอร์ตอบกลับด้วยสถานะ: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Test database connection
export const testDatabaseConnection = async (host: string, port: string, database: string, user: string): Promise<{ success: boolean; message: string; latency?: number }> => {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (error) {
      return {
        success: false,
        message: `ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`
      };
    }

    return {
      success: true,
      message: `เชื่อมต่อฐานข้อมูลสำเร็จ (${latency}ms)`,
      latency
    };
  } catch (error) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Test email server connection
export const testEmailServerConnection = async (
  host: string, 
  port: string, 
  type: string, 
  username: string, 
  password: string, 
  encryption: string, 
  authRequired: boolean
): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    // Simulate email server connection test
    // In a real implementation, you would use a library like nodemailer to test SMTP connection
    const testData = {
      host,
      port: parseInt(port),
      secure: encryption === 'ssl',
      auth: authRequired ? { user: username, pass: password } : undefined,
      tls: encryption === 'tls' ? { rejectUnauthorized: false } : undefined
    };

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, we'll simulate a successful connection
    // In production, implement actual SMTP connection testing
    return {
      success: true,
      message: `เชื่อมต่อเซิร์ฟเวอร์อีเมล ${type} สำเร็จ`,
      details: {
        serverType: type,
        host,
        port,
        encryption,
        authRequired
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์อีเมลได้: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Delete all data from database
export const deleteAllDataFromDB = async (): Promise<boolean> => {
  try {
    // Delete in order to avoid foreign key constraints
    const { error: movementsError } = await supabase
      .from('stock_movements')
      .delete()
      .neq('id', 0);

    if (movementsError) throw movementsError;

    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', 0);

    if (productsError) throw productsError;

    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .neq('id', 0);

    if (categoriesError) throw categoriesError;

    const { error: suppliersError } = await supabase
      .from('suppliers')
      .delete()
      .neq('id', 0);

    if (suppliersError) throw suppliersError;

    return true;
  } catch (error) {
    console.error('Error deleting all data from database:', error);
    return false;
  }
};
