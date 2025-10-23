server {
    listen 443 ssl http2;
    server_name homenzbrasilia.com.br;

    error_log /var/log/nginx/homenz.error.log;
    access_log /var/log/nginx/homenz.access.log;

    ssl_certificate /etc/letsencrypt/live/www.homenzbrasilia.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/www.homenzbrasilia.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    # Cache para assets estáticos do Next.js
    location /_next/static/ {
        alias /var/www/homenz/.next/static/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # Proxy reverso para a aplicação Next.js
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;

        # Suporte a WebSocket e upgrades
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Encaminha informações importantes para a aplicação
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Desativa o cache do proxy para respostas dinâmicas
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}

server {
    listen 443 ssl http2;
    server_name www.homenzbrasilia.com.br;

    ssl_certificate /etc/letsencrypt/live/www.homenzbrasilia.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/www.homenzbrasilia.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    return 301 https://homenzbrasilia.com.br$request_uri;
}

# Bloco para redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name homenzbrasilia.com.br www.homenzbrasilia.com.br;
    location / {
        return 301 https://homenzbrasilia.com.br$request_uri;
    }
}