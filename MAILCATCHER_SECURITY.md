# Mailcatcher Security Configuration

This document outlines the security measures implemented for mailcatcher in staging environments to prevent spam and unauthorized access.

## 🔒 Security Measures Implemented

### 1. Basic Authentication
- Mailcatcher web interface is protected with HTTP Basic Auth
- Default credentials: `admin` / `password` (change in production!)
- Access via: `https://mailcatcher.yourdomain.com`

### 2. Environment-Based Enabling
- Mailcatcher is only enabled when `MAILCATCHER_ENABLED=true`
- Disabled by default in production environments
- Can be toggled without rebuilding containers

### 3. Network Isolation
- Mailcatcher only accepts SMTP connections from internal Docker network
- Web interface only accessible via Traefik proxy with HTTPS

## 🛡️ Additional Security Recommendations

### 1. Rate Limiting (Recommended)
Add rate limiting to prevent email spam:

```yaml
# Add to mailcatcher labels in docker-compose.yml
- traefik.http.middlewares.${STACK_NAME}-mailcatcher-ratelimit.ratelimit.burst=10
- traefik.http.middlewares.${STACK_NAME}-mailcatcher-ratelimit.ratelimit.average=5
- traefik.http.routers.${STACK_NAME}-mailcatcher-https.middlewares=${STACK_NAME}-mailcatcher-auth,${STACK_NAME}-mailcatcher-ratelimit
```

### 2. IP Whitelisting (Optional)
Restrict access to specific IP addresses:

```yaml
# Add to mailcatcher labels
- traefik.http.middlewares.${STACK_NAME}-mailcatcher-whitelist.ipwhitelist.sourcerange=192.168.1.0/24,10.0.0.0/8
```

### 3. Resource Limits
Add Docker resource constraints:

```yaml
mailcatcher:
  # ... existing config
  deploy:
    resources:
      limits:
        memory: 256M
        cpus: '0.5'
      reservations:
        memory: 128M
        cpus: '0.25'
```

## 🔧 Configuration Setup

### GitHub Repository Secrets
Add these optional secrets for enhanced security:

1. **MAILCATCHER_AUTH_USERS** (optional)
   - Format: `username:hashed_password`
   - Generate hash: `echo $(htpasswd -nb username password) | sed -e s/\\$/\\$\\$/g`
   - Example: `admin:$2y$10$2b2cu/b9O/B1pxq2fxeWuOdrs3KM6QOdUbrr4FQjHWxcpsZH4aOOy`

### Default Credentials
If no custom auth is set, default credentials are:
- **Username**: `admin`
- **Password**: `password`

**⚠️ IMPORTANT: Change these in production!**

## 🚨 Security Risks and Mitigations

### Risk: Email Content Exposure
- **Risk**: Captured emails may contain sensitive information
- **Mitigation**: Use basic auth, HTTPS, and limit access to dev team only

### Risk: Memory/Disk Usage
- **Risk**: Large volumes of emails could consume server resources
- **Mitigation**: 
  - Monitor mailcatcher memory usage
  - Implement resource limits
  - Regularly clear mailcatcher data
  - Consider using external email testing service for high-volume testing

### Risk: Spam/DoS
- **Risk**: Malicious actors could spam the email system
- **Mitigation**:
  - Rate limiting on Traefik level
  - Application-level email sending limits
  - Monitor for unusual email patterns

## 📊 Monitoring

### Check Mailcatcher Status
```bash
# Check if mailcatcher is running
docker compose ps mailcatcher

# Check mailcatcher logs
docker compose logs mailcatcher

# Check memory usage
docker stats mailcatcher
```

### Clear Mailcatcher Data
```bash
# Restart mailcatcher to clear all emails
docker compose restart mailcatcher
```

## 🔄 Disabling Mailcatcher

### Temporary Disable
Set environment variable:
```bash
MAILCATCHER_ENABLED=false
```

### Permanent Disable
Remove or comment out the mailcatcher service in `docker-compose.yml`

## 🎯 Best Practices

1. **Use only in staging/dev**: Never enable in production
2. **Change default passwords**: Always use custom auth credentials
3. **Monitor resource usage**: Keep an eye on memory/CPU consumption
4. **Regular cleanup**: Restart mailcatcher periodically to clear data
5. **Limit access**: Only provide access to team members who need it
6. **Use HTTPS**: Always access via secure connection
7. **Consider alternatives**: For high-volume testing, use dedicated email testing services

## 🔗 Alternative Solutions

For production-like email testing without security risks:

1. **Mailtrap.io**: Dedicated email testing service
2. **MailHog**: Alternative to mailcatcher with more features
3. **SendGrid/Mailgun**: Use test modes of production email services
4. **AWS SES**: Use sandbox mode for testing

## 📝 Security Checklist

- [ ] Basic auth configured
- [ ] HTTPS enabled
- [ ] Default passwords changed
- [ ] Resource limits set (optional)
- [ ] Rate limiting configured (optional)
- [ ] IP whitelisting configured (optional)
- [ ] Team access documented
- [ ] Monitoring in place
- [ ] Cleanup procedures established
