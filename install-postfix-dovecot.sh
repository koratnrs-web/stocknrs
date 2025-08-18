#!/bin/bash

# Postfix + Dovecot Installation Script for StockFlow
# Compatible with Ubuntu 20.04+ and Debian 11+

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get domain name
echo -e "${BLUE}=== Postfix + Dovecot Installation for StockFlow ===${NC}"
echo
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
read -p "Enter admin email (e.g., admin@example.com): " ADMIN_EMAIL
read -p "Enter server IP address: " SERVER_IP

if [[ -z "$DOMAIN_NAME" || -z "$ADMIN_EMAIL" || -z "$SERVER_IP" ]]; then
    print_error "All fields are required!"
    exit 1
fi

print_status "Starting installation for domain: $DOMAIN_NAME"

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing Postfix, Dovecot, and dependencies..."
apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d dovecot-mysql certbot

# Configure Postfix
print_status "Configuring Postfix..."

# Backup original config
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Create new main.cf
cat > /etc/postfix/main.cf << EOF
# Basic Settings
myhostname = mail.$DOMAIN_NAME
mydomain = $DOMAIN_NAME
myorigin = \$mydomain
inet_interfaces = all
inet_protocols = ipv4

# Network Settings
mynetworks = 127.0.0.0/8, ::ffff:127.0.0.0/104, ::1/128, $SERVER_IP/24
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
smtpd_sasl_local_domain = \$myhostname

# TLS/SSL Settings (will be updated after SSL certificate)
smtpd_tls_cert_file = /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem
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

# Performance
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 30
smtpd_client_recipient_rate_limit = 30
smtpd_client_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
EOF

# Configure master.cf
print_status "Configuring Postfix master.cf..."
cp /etc/postfix/master.cf /etc/postfix/master.cf.backup

# Add submission and smtps ports
cat >> /etc/postfix/master.cf << EOF

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
  -o smtpd_tls_session_cache_database=btree:\${data_directory}/smtpd_scache
  -o smtpd_tls_session_cache_timeout=3600s
  -o smtpd_tls_ask_ccert=yes
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
  -o smtpd_tls_session_cache_database=btree:\${data_directory}/smtpd_scache
  -o smtpd_tls_session_cache_timeout=3600s
  -o smtpd_tls_ask_ccert=yes
  -o smtpd_tls_loglevel=1
EOF

# Configure Dovecot
print_status "Configuring Dovecot..."

# Configure mail location
sed -i 's|#mail_location =|mail_location = maildir:~/Maildir|' /etc/dovecot/conf.d/10-mail.conf

# Configure authentication
sed -i 's|#disable_plaintext_auth = yes|disable_plaintext_auth = yes|' /etc/dovecot/conf.d/10-auth.conf
sed -i 's|#auth_mechanisms = plain|auth_mechanisms = plain login|' /etc/dovecot/conf.d/10-auth.conf

# Configure SSL
sed -i 's|#ssl = yes|ssl = required|' /etc/dovecot/conf.d/10-ssl.conf
sed -i 's|#ssl_cert =|ssl_cert = </etc/letsencrypt/live/'$DOMAIN_NAME'/fullchain.pem|' /etc/dovecot/conf.d/10-ssl.conf
sed -i 's|#ssl_key =|ssl_key = </etc/letsencrypt/live/'$DOMAIN_NAME'/privkey.pem|' /etc/dovecot/conf.d/10-ssl.conf

# Configure Postfix authentication
cat >> /etc/dovecot/conf.d/10-master.conf << EOF

service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
EOF

# Create mail group if it doesn't exist
if ! getent group mail > /dev/null 2>&1; then
    groupadd mail
fi

# Add postfix user to mail group
usermod -a -G mail postfix

# Create SSL certificate
print_status "Creating SSL certificate with Let's Encrypt..."
if certbot certonly --standalone -d $DOMAIN_NAME -d mail.$DOMAIN_NAME --non-interactive --agree-tos --email $ADMIN_EMAIL; then
    print_success "SSL certificate created successfully"
else
    print_warning "Failed to create SSL certificate. Please check your domain DNS settings."
    print_warning "You can create the certificate manually later with:"
    print_warning "certbot certonly --standalone -d $DOMAIN_NAME -d mail.$DOMAIN_NAME"
fi

# Configure firewall
print_status "Configuring firewall..."
ufw allow 25/tcp   # SMTP
ufw allow 465/tcp  # SMTPS
ufw allow 587/tcp  # Submission
ufw allow 110/tcp  # POP3
ufw allow 143/tcp  # IMAP
ufw allow 993/tcp  # IMAPS
ufw allow 995/tcp  # POP3S

# Create sample users
print_status "Creating sample email users..."
read -p "Do you want to create sample email users? (y/n): " CREATE_USERS

if [[ $CREATE_USERS =~ ^[Yy]$ ]]; then
    read -p "Enter username for first email user: " USER1
    read -p "Enter username for second email user: " USER2
    
    if [[ -n "$USER1" ]]; then
        useradd -m -s /bin/bash $USER1
        mkdir -p /home/$USER1/Maildir
        chown -R $USER1:$USER1 /home/$USER1/Maildir
        chmod 700 /home/$USER1/Maildir
        print_success "Created user: $USER1@$DOMAIN_NAME"
    fi
    
    if [[ -n "$USER2" ]]; then
        useradd -m -s /bin/bash $USER2
        mkdir -p /home/$USER2/Maildir
        chown -R $USER2:$USER2 /home/$USER2/Maildir
        chmod 700 /home/$USER2/Maildir
        print_success "Created user: $USER2@$DOMAIN_NAME"
    fi
fi

# Set up SSL certificate renewal
print_status "Setting up SSL certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Start and enable services
print_status "Starting and enabling services..."
systemctl restart postfix
systemctl enable postfix
systemctl restart dovecot
systemctl enable dovecot

# Test configuration
print_status "Testing configuration..."
if postfix check; then
    print_success "Postfix configuration is valid"
else
    print_error "Postfix configuration has errors"
fi

if doveconf -n > /dev/null 2>&1; then
    print_success "Dovecot configuration is valid"
else
    print_error "Dovecot configuration has errors"
fi

# Display configuration summary
echo
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo
echo -e "${BLUE}Domain:${NC} $DOMAIN_NAME"
echo -e "${BLUE}Admin Email:${NC} $ADMIN_EMAIL"
echo -e "${BLUE}Server IP:${NC} $SERVER_IP"
echo
echo -e "${BLUE}Email Server Settings:${NC}"
echo -e "  SMTP (Port 25): $DOMAIN_NAME"
echo -e "  SMTPS (Port 465): $DOMAIN_NAME"
echo -e "  Submission (Port 587): $DOMAIN_NAME"
echo -e "  IMAP (Port 143): $DOMAIN_NAME"
echo -e "  IMAPS (Port 993): $DOMAIN_NAME"
echo -e "  POP3 (Port 110): $DOMAIN_NAME"
echo -e "  POP3S (Port 995): $DOMAIN_NAME"
echo
echo -e "${BLUE}StockFlow Configuration:${NC}"
echo -e "  Server Type: Postfix + Dovecot"
echo -e "  Host: $DOMAIN_NAME"
echo -e "  Port: 587 (recommended) or 465"
echo -e "  Encryption: TLS (recommended) or SSL"
echo -e "  Authentication: Required"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Update your DNS records with MX and A records"
echo -e "2. Test email connectivity from StockFlow"
echo -e "3. Configure email clients to use the new server"
echo -e "4. Monitor logs: /var/log/mail.log and /var/log/dovecot.log"
echo
echo -e "${YELLOW}Note:${NC} If SSL certificate creation failed, please check your domain DNS settings"
echo -e "and run: certbot certonly --standalone -d $DOMAIN_NAME -d mail.$DOMAIN_NAME"
echo
print_success "Postfix + Dovecot installation completed successfully!"
