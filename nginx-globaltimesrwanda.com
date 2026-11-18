# --------------------
# HTTP → HTTPS redirect
# --------------------
server {
    listen 80;
    listen [::]:80;
    server_name globaltimesrwanda.com www.globaltimesrwanda.com;
    return 301 https://globaltimesrwanda.com$request_uri;
}

# --------------------
# HTTPS (React + NestJS)
# --------------------
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name globaltimesrwanda.com www.globaltimesrwanda.com;

    ssl_certificate     /etc/letsencrypt/live/globaltimesrwanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/globaltimesrwanda.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 20M;

    # ── Uploaded files ────────────────────────────────────────────────
    location /uploads/ {
        alias /var/www/apps/globaltimesrwanda/backend/uploads/;
        autoindex off;
        add_header Access-Control-Allow-Origin *;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/uploads/ {
        alias /var/www/apps/globaltimesrwanda/backend/uploads/;
        autoindex off;
        add_header Access-Control-Allow-Origin *;
    }

    # ── Backend API routes → NestJS on port 6000 ─────────────────────
    location ~ ^/(auth|advertisements|media|upload|comments|stats|contact|announcements|preview|news-related)(/|$) {
        proxy_pass http://127.0.0.1:6000;
        include proxy_params;
        proxy_read_timeout 60s;
    }

    # ── /api/* → NestJS ───────────────────────────────────────────────
    location /api/ {
        proxy_pass http://127.0.0.1:6000/;
        include proxy_params;
    }

    # ── /news/* — bots get OG-tagged HTML from backend,
    #              real browsers get the React SPA ─────────────────────
    location ~* ^/news/(.+)$ {
        # Detect social media bots by User-Agent
        if ($http_user_agent ~* "(facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest|yandexbot|duckduckbot|viber|skype)") {
            proxy_pass http://127.0.0.1:6000;
            break;
        }
        # Real browsers → serve the React SPA
        root /var/www/apps/globaltimesrwanda/frontend/dist;
        try_files $uri /index.html;
    }

    # ── NestJS news API (exact /news and /news/slug/... etc.) ─────────
    location = /news {
        proxy_pass http://127.0.0.1:6000;
        include proxy_params;
    }

    # ── Frontend React SPA ────────────────────────────────────────────
    location / {
        root  /var/www/apps/globaltimesrwanda/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
