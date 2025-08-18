@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo Postfix + Dovecot Installation for StockFlow
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Get domain information
set /p DOMAIN_NAME="Enter your domain name (e.g., example.com): "
set /p ADMIN_EMAIL="Enter admin email (e.g., admin@example.com): "
set /p SERVER_IP="Enter server IP address: "

if "%DOMAIN_NAME%"=="" (
    echo [ERROR] Domain name is required!
    pause
    exit /b 1
)

if "%ADMIN_EMAIL%"=="" (
    echo [ERROR] Admin email is required!
    pause
    exit /b 1
)

if "%SERVER_IP%"=="" (
    echo [ERROR] Server IP is required!
    pause
    exit /b 1
)

echo.
echo [INFO] Starting installation for domain: %DOMAIN_NAME%
echo.

REM Check if WSL is available
wsl --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] WSL (Windows Subsystem for Linux) is not available
    echo Please install WSL first:
    echo 1. Open PowerShell as Administrator
    echo 2. Run: wsl --install
    echo 3. Restart your computer
    echo 4. Run this script again
    pause
    exit /b 1
)

echo [INFO] WSL is available. Installing Ubuntu...
echo.

REM Install Ubuntu if not already installed
wsl -l -v | findstr "Ubuntu" >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Installing Ubuntu on WSL...
    wsl --install -d Ubuntu
    echo.
    echo [INFO] Ubuntu installation started. Please complete the setup in the new terminal.
    echo After Ubuntu setup is complete, run this script again.
    pause
    exit /b 0
)

echo [INFO] Ubuntu is already installed on WSL
echo.

REM Create installation script for WSL
echo [INFO] Creating installation script for WSL...
(
echo #!/bin/bash
echo set -e
echo.
echo echo "=== Postfix + Dovecot Installation for StockFlow ==="
echo echo "Domain: %DOMAIN_NAME%"
echo echo "Admin Email: %ADMIN_EMAIL%"
echo echo "Server IP: %SERVER_IP%"
echo echo.
echo.
echo # Update system
echo echo "[INFO] Updating system packages..."
echo sudo apt update ^&^& sudo apt upgrade -y
echo.
echo # Install required packages
echo echo "[INFO] Installing Postfix, Dovecot, and dependencies..."
echo sudo apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d dovecot-mysql certbot
echo.
echo # Configure Postfix
echo echo "[INFO] Configuring Postfix..."
echo sudo cp /etc/postfix/main.cf /etc/postfix/main.cf.backup
echo.
echo # Create main.cf
echo sudo tee /etc/postfix/main.cf ^> /dev/null ^<^< 'EOF'
echo # Basic Settings
echo myhostname = mail.%DOMAIN_NAME%
echo mydomain = %DOMAIN_NAME%
echo myorigin = \$mydomain
echo inet_interfaces = all
echo inet_protocols = ipv4
echo.
echo # Network Settings
echo mynetworks = 127.0.0.0/8, ::ffff:127.0.0.0/104, ::1/128, %SERVER_IP%/24
echo mynetworks_style = subnet
echo.
echo # Mailbox Settings
echo home_mailbox = Maildir/
echo mailbox_command =
echo mailbox_transport = lmtp:unix:private/dovecot-lmtp
echo.
echo # Authentication
echo smtpd_sasl_auth_enable = yes
echo smtpd_sasl_type = dovecot
echo smtpd_sasl_path = private/auth
echo smtpd_sasl_security_options = noanonymous
echo smtpd_sasl_local_domain = \$myhostname
echo.
echo # TLS/SSL Settings
echo smtpd_tls_cert_file = /etc/letsencrypt/live/%DOMAIN_NAME%/fullchain.pem
echo smtpd_tls_key_file = /etc/letsencrypt/live/%DOMAIN_NAME%/privkey.pem
echo smtpd_tls_security_level = may
echo smtpd_tls_protocols = !SSLv2, !SSLv3
echo smtpd_tls_ciphers = high
echo smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3
echo smtpd_tls_mandatory_ciphers = high
echo.
echo # Submission Port (587)
echo smtpd_tls_auth_only = yes
echo smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
echo smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
echo.
echo # Performance
echo smtpd_client_connection_rate_limit = 30
echo smtpd_client_message_rate_limit = 30
echo smtpd_client_recipient_rate_limit = 30
echo smtpd_client_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
echo EOF
echo.
echo # Configure Dovecot
echo echo "[INFO] Configuring Dovecot..."
echo sudo sed -i 's|#mail_location =|mail_location = maildir:~/Maildir|' /etc/dovecot/conf.d/10-mail.conf
echo sudo sed -i 's|#disable_plaintext_auth = yes|disable_plaintext_auth = yes|' /etc/dovecot/conf.d/10-auth.conf
echo sudo sed -i 's|#auth_mechanisms = plain|auth_mechanisms = plain login|' /etc/dovecot/conf.d/10-auth.conf
echo sudo sed -i 's|#ssl = yes|ssl = required|' /etc/dovecot/conf.d/10-ssl.conf
echo.
echo # Create SSL certificate
echo echo "[INFO] Creating SSL certificate with Let's Encrypt..."
echo if sudo certbot certonly --standalone -d %DOMAIN_NAME% -d mail.%DOMAIN_NAME% --non-interactive --agree-tos --email %ADMIN_EMAIL%; then
echo     echo "[SUCCESS] SSL certificate created successfully"
echo else
echo     echo "[WARNING] Failed to create SSL certificate. Please check your domain DNS settings."
echo fi
echo.
echo # Configure firewall
echo echo "[INFO] Configuring firewall..."
echo sudo ufw allow 25/tcp   # SMTP
echo sudo ufw allow 465/tcp  # SMTPS
echo sudo ufw allow 587/tcp  # Submission
echo sudo ufw allow 110/tcp  # POP3
echo sudo ufw allow 143/tcp  # IMAP
echo sudo ufw allow 993/tcp  # IMAPS
echo sudo ufw allow 995/tcp  # POP3S
echo.
echo # Start and enable services
echo echo "[INFO] Starting and enabling services..."
echo sudo systemctl restart postfix
echo sudo systemctl enable postfix
echo sudo systemctl restart dovecot
echo sudo systemctl enable dovecot
echo.
echo # Test configuration
echo echo "[INFO] Testing configuration..."
echo if sudo postfix check; then
echo     echo "[SUCCESS] Postfix configuration is valid"
echo else
echo     echo "[ERROR] Postfix configuration has errors"
echo fi
echo.
echo if sudo doveconf -n ^> /dev/null 2^>^&1; then
echo     echo "[SUCCESS] Dovecot configuration is valid"
echo else
echo     echo "[ERROR] Dovecot configuration has errors"
echo fi
echo.
echo echo
echo echo "=== Installation Complete ==="
echo echo "Domain: %DOMAIN_NAME%"
echo echo "Admin Email: %ADMIN_EMAIL%"
echo echo "Server IP: %SERVER_IP%"
echo echo.
echo echo "Email Server Settings:"
echo echo "  SMTP (Port 25): %DOMAIN_NAME%"
echo echo "  SMTPS (Port 465): %DOMAIN_NAME%"
echo echo "  Submission (Port 587): %DOMAIN_NAME%"
echo echo "  IMAP (Port 143): %DOMAIN_NAME%"
echo echo "  IMAPS (Port 993): %DOMAIN_NAME%"
echo echo "  POP3 (Port 110): %DOMAIN_NAME%"
echo echo "  POP3S (Port 995): %DOMAIN_NAME%"
echo echo.
echo echo "StockFlow Configuration:"
echo echo "  Server Type: Postfix + Dovecot"
echo echo "  Host: %DOMAIN_NAME%"
echo echo "  Port: 587 (recommended) or 465"
echo echo "  Encryption: TLS (recommended) or SSL"
echo echo "  Authentication: Required"
echo echo.
echo echo "Next Steps:"
echo echo "1. Update your DNS records with MX and A records"
echo echo "2. Test email connectivity from StockFlow"
echo echo "3. Configure email clients to use the new server"
echo echo "4. Monitor logs: /var/log/mail.log and /var/log/dovecot.log"
echo.
echo echo "[SUCCESS] Postfix + Dovecot installation completed successfully!"
) > install-postfix-wsl.sh

echo [INFO] Installation script created: install-postfix-wsl.sh
echo.

REM Make script executable and run in WSL
echo [INFO] Running installation script in WSL...
wsl chmod +x install-postfix-wsl.sh
wsl ./install-postfix-wsl.sh

echo.
echo [INFO] Installation completed in WSL
echo.
echo [INFO] Next steps:
echo 1. Update your DNS records with MX and A records for %DOMAIN_NAME%
echo 2. Test email connectivity from StockFlow
echo 3. Configure email clients to use the new server
echo.
echo [INFO] To access the email server from Windows:
echo - Use %DOMAIN_NAME% as the server hostname
echo - Port 587 for SMTP submission (recommended)
echo - Port 993 for IMAP with SSL
echo - Port 995 for POP3 with SSL
echo.
echo [SUCCESS] Postfix + Dovecot installation completed successfully!
pause
