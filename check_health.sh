#!/bin/bash

echo "Checking system health..."

# Check Docker
if systemctl is-active --quiet docker; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is NOT running"
fi

# Check Docker Compose containers
echo "Checking containers..."
docker-compose ps

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is NOT running"
fi

# Check SSL Certificate Expiry (dry run check)
echo "Checking SSL certificate..."
if sudo certbot certificates | grep -q "newapi.hospitalitygroup.in"; then
    echo "✅ SSL Certificate found for newapi.hospitalitygroup.in"
else
    echo "⚠️  SSL Certificate NOT found for newapi.hospitalitygroup.in"
fi

# Check Application Endpoint (assuming running on port 1337)
echo "Checking application response..."
if curl -s http://localhost:1337 > /dev/null; then
    echo "✅ Application is responding on localhost:1337"
else
    echo "❌ Application is NOT responding on localhost:1337"
fi

echo "Health check complete."
