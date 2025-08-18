# คู่มือการตั้งค่า Postfix + Dovecot สำหรับใช้งานจริง

## 📋 ภาพรวม

คู่มือนี้จะแนะนำการตั้งค่า Postfix (SMTP Server) และ Dovecot (IMAP/POP3 Server) บน Ubuntu/Debian เพื่อใช้งานจริงกับระบบ StockFlow

## 🚀 การติดตั้ง

### 1. อัปเดตระบบ
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. ติดตั้ง Postfix และ Dovecot
```bash
sudo apt install postfix dovecot-core dovecot-imapd dovecot-pop3d dovecot-mysql -y
```

### 3. ติดตั้ง SSL/TLS
```bash
sudo apt install certbot -y
```

## ⚙️ การตั้งค่า Postfix

### 1. ตั้งค่า Postfix ครั้งแรก
```bash
sudo dpkg-reconfigure postfix
```

เลือก:
- **General type of mail configuration**: `Internet Site`
- **System mail name**: `yourdomain.com` (แทนที่ด้วยโดเมนจริง)
- **Root and postmaster mail recipient**: `admin@yourdomain.com`
- **Other destinations**: `yourdomain.com, localhost.localdomain, localhost`
- **Force synchronous updates**: `No`
- **Local networks**: `127.0.0.0/8, ::ffff:127.0.0.0/104, ::1/128`
- **Mailbox size limit**: `0` (ไม่จำกัด)
- **Local address extension character**: `+`
- **Internet protocols**: `all`

### 2. แก้ไขไฟล์ main.cf
```bash
sudo nano /etc/postfix/main.cf
```

เพิ่ม/แก้ไขการตั้งค่าต่อไปนี้:

```conf
# Basic Settings
myhostname = mail.yourdomain.com
mydomain = yourdomain.com
myorigin = $mydomain
inet_interfaces = all
inet_protocols = ipv4

# Network Settings
mynetworks = 127.0.0.0/8, ::ffff:127.0.0.0/104, ::1/128, 192.168.1.0/24
mynetworks_style = subnet

# Mailbox Settings
home_mailbox = Maildir/
mailbox_command =
mailbox_transport = lmtp:unix:private/dovecot-lmtp

# Authentication
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = $myhostname

# TLS/SSL Settings
smtpd_tls_cert_file = /etc/letsencrypt/live/yourdomain.com/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/yourdomain.com/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3
smtpd_tls_ciphers = high
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3
smtpd_tls_mandatory_ciphers = high
smtpd_tls_mandatory_exclude_ciphers = aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA
smtpd_tls_exclude_ciphers = aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA

# Submission Port (587)
smtpd_tls_auth_only = yes
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# SMTPS Port (465)
smtps_tls_security_level = may
smtps_tls_protocols = !SSLv2, !SSLv3
smtps_tls_ciphers = high
smtps_tls_mandatory_protocols = !SSLv2, !SSLv3
smtps_tls_mandatory_ciphers = high
smtps_tls_mandatory_exclude_ciphers = aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA
smtps_tls_exclude_ciphers = aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA

# Performance
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 30
smtpd_client_recipient_rate_limit = 30
smtpd_client_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
```

### 3. แก้ไขไฟล์ master.cf
```bash
sudo nano /etc/postfix/master.cf
```

เพิ่มการตั้งค่าต่อไปนี้:

```conf
# Submission (Port 587)
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
  -o smtpd_helo_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_invalid_helo_hostname,reject_non_fqdn_helo_hostname
  -o smtpd_sender_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_non_fqdn_sender,reject_unknown_sender_domain,reject_unlisted_sender
  -o smtpd_recipient_restrictions=reject_non_fqdn_recipient,reject_unauth_destination,permit_mynetworks,permit_sasl_authenticated,reject
  -o mynetworks=127.0.0.0/8
  -o strict_rfc821_envelope=yes
  -o receive_override_options=no_unknown_recipient_checks,no_header_body_checks
  -o smtpd_tls_security_level=encrypt
  -o smtpd_tls_ciphers=high
  -o smtpd_tls_protocols=!SSLv2,!SSLv3
  -o smtpd_tls_mandatory_protocols=!SSLv2,!SSLv3
  -o smtpd_tls_mandatory_ciphers=high
  -o smtpd_tls_mandatory_exclude_ciphers=aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA
  -o smtpd_tls_exclude_ciphers=aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA
  -o smtpd_tls_auth_only=yes
  -o smtpd_tls_received_header=yes
  -o smtpd_tls_session_cache_database=btree:${data_directory}/smtpd_scache
  -o smtpd_tls_session_cache_timeout=3600s
  -o smtpd_tls_ask_ccert=yes
  -o smtpd_tls_security_level=encrypt
  -o smtpd_tls_loglevel=1

# SMTPS (Port 465)
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
  -o smtpd_helo_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_invalid_helo_hostname,reject_non_fqdn_helo_hostname
  -o smtpd_sender_restrictions=permit_mynetworks,permit_sasl_authenticated,reject_non_fqdn_sender,reject_unknown_sender_domain,reject_unlisted_sender
  -o smtpd_recipient_restrictions=reject_non_fqdn_recipient,reject_unauth_destination,permit_mynetworks,permit_sasl_authenticated,reject
  -o mynetworks=127.0.0.0/8
  -o strict_rfc821_envelope=yes
  -o receive_override_options=no_unknown_recipient_checks,no_header_body_checks
  -o smtpd_tls_security_level=encrypt
  -o smtpd_tls_ciphers=high
  -o smtpd_tls_protocols=!SSLv2,!SSLv3
  -o smtpd_tls_mandatory_protocols=!SSLv2,!SSLv3
  -o smtpd_tls_mandatory_ciphers=high
  -o smtpd_tls_mandatory_exclude_ciphers=aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA
  -o smtpd_tls_exclude_ciphers=aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, aECDH, EDH-DSS-DES-CBC3-SHA, EDH-RSA-DES-CBC3-SHA, KRB5-DES, CBC3-SHA
  -o smtpd_tls_auth_only=yes
  -o smtpd_tls_received_header=yes
  -o smtpd_tls_session_cache_database=btree:${data_directory}/smtpd_scache
  -o smtpd_tls_session_cache_timeout=3600s
  -o smtpd_tls_ask_ccert=yes
  -o smtpd_tls_security_level=encrypt
  -o smtpd_tls_loglevel=1
```

## ⚙️ การตั้งค่า Dovecot

### 1. สร้างไฟล์การตั้งค่า
```bash
sudo nano /etc/dovecot/conf.d/10-mail.conf
```

แก้ไข:
```conf
mail_location = maildir:~/Maildir
mail_privileged_group = mail
mail_access_groups = mail
```

### 2. ตั้งค่า Authentication
```bash
sudo nano /etc/dovecot/conf.d/10-auth.conf
```

แก้ไข:
```conf
disable_plaintext_auth = yes
auth_mechanisms = plain login
```

### 3. ตั้งค่า SSL/TLS
```bash
sudo nano /etc/dovecot/conf.d/10-ssl.conf
```

แก้ไข:
```conf
ssl = required
ssl_cert = </etc/letsencrypt/live/yourdomain.com/fullchain.pem
ssl_key = </etc/letsencrypt/live/yourdomain.com/privkey.pem
ssl_protocols = !SSLv2 !SSLv3
ssl_cipher_list = ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!DSS
ssl_prefer_server_ciphers = yes
```

### 4. ตั้งค่า Postfix Authentication
```bash
sudo nano /etc/dovecot/conf.d/10-master.conf
```

แก้ไข:
```conf
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
```

## 🔐 การสร้าง SSL Certificate

### 1. สร้าง Certificate ด้วย Let's Encrypt
```bash
sudo certbot certonly --standalone -d yourdomain.com -d mail.yourdomain.com
```

### 2. อัปเดต Certificate อัตโนมัติ
```bash
sudo crontab -e
```

เพิ่ม:
```cron
0 12 * * * /usr/bin/certbot renew --quiet
```

## 👥 การสร้างผู้ใช้อีเมล

### 1. สร้างผู้ใช้ระบบ
```bash
sudo adduser user1
sudo adduser user2
```

### 2. สร้าง Maildir
```bash
sudo mkdir -p /home/user1/Maildir
sudo mkdir -p /home/user2/Maildir
sudo chown -R user1:user1 /home/user1/Maildir
sudo chown -R user2:user2 /home/user2/Maildir
```

### 3. ตั้งค่าสิทธิ์
```bash
sudo chmod 700 /home/user1/Maildir
sudo chmod 700 /home/user2/Maildir
```

## 🔧 การตั้งค่า Firewall

### 1. เปิดพอร์ตที่จำเป็น
```bash
sudo ufw allow 25/tcp   # SMTP
sudo ufw allow 465/tcp  # SMTPS
sudo ufw allow 587/tcp  # Submission
sudo ufw allow 110/tcp  # POP3
sudo ufw allow 143/tcp  # IMAP
sudo ufw allow 993/tcp  # IMAPS
sudo ufw allow 995/tcp  # POP3S
```

### 2. เปิดใช้งาน Firewall
```bash
sudo ufw enable
```

## 🚀 การเริ่มต้นบริการ

### 1. รีสตาร์ท Postfix
```bash
sudo systemctl restart postfix
sudo systemctl enable postfix
```

### 2. รีสตาร์ท Dovecot
```bash
sudo systemctl restart dovecot
sudo systemctl enable dovecot
```

### 3. ตรวจสอบสถานะ
```bash
sudo systemctl status postfix
sudo systemctl status dovecot
```

## 📧 การทดสอบ

### 1. ทดสอบ SMTP (Port 587)
```bash
telnet yourdomain.com 587
EHLO yourdomain.com
STARTTLS
```

### 2. ทดสอบ IMAP (Port 993)
```bash
openssl s_client -connect yourdomain.com:993 -crlf
```

### 3. ทดสอบการส่งอีเมล
```bash
echo "Subject: Test Email" | sendmail user1@yourdomain.com
```

## 🔍 การแก้ไขปัญหา

### 1. ตรวจสอบ Log
```bash
sudo tail -f /var/log/mail.log
sudo tail -f /var/log/dovecot.log
```

### 2. ตรวจสอบการตั้งค่า
```bash
sudo postconf -n
sudo doveconf -n
```

### 3. ทดสอบการเชื่อมต่อ
```bash
sudo netstat -tlnp | grep :587
sudo netstat -tlnp | grep :993
```

## 📱 การตั้งค่าใน StockFlow

### 1. ไปที่หน้า Settings > การเชื่อมต่อ

### 2. ตั้งค่าเซิร์ฟเวอร์อีเมล:
- **ประเภทเซิร์ฟเวอร์**: Postfix + Dovecot
- **Host**: yourdomain.com หรือ IP ของเซิร์ฟเวอร์
- **Port**: 587 (Submission) หรือ 465 (SMTPS)
- **การเข้ารหัส**: TLS (แนะนำ) หรือ SSL
- **การยืนยันตัวตน**: เปิดใช้งาน
- **ชื่อผู้ใช้**: user1@yourdomain.com
- **รหัสผ่าน**: รหัสผ่านของผู้ใช้

### 3. คลิก "🔍 ทดสอบการเชื่อมต่อ"

## ✅ การตรวจสอบ

### 1. ตรวจสอบการส่งอีเมล
- ส่งอีเมลทดสอบจาก StockFlow
- ตรวจสอบว่าอีเมลถึงผู้รับ

### 2. ตรวจสอบการรับอีเมล
- ใช้โปรแกรมอีเมล (Thunderbird, Outlook) เชื่อมต่อ
- ตรวจสอบว่าสามารถรับอีเมลได้

### 3. ตรวจสอบความปลอดภัย
- ใช้ https://www.checktls.com/ ทดสอบ
- ตรวจสอบ SSL Labs: https://www.ssllabs.com/ssltest/

## 🆘 การสนับสนุน

หากพบปัญหา:
1. ตรวจสอบ Log files
2. ตรวจสอบการตั้งค่า Firewall
3. ตรวจสอบ DNS records
4. ตรวจสอบ SSL certificate
5. ตรวจสอบการตั้งค่า Postfix และ Dovecot

---

**หมายเหตุ**: แทนที่ `yourdomain.com` ด้วยโดเมนจริงของคุณ และปรับแต่งการตั้งค่าตามความต้องการ
