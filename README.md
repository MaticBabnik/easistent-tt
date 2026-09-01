# easistent-tt

eAsistent public timetable scraper.

## Features

- Fetch all events for a given week
- Integrates with calendar apps via http(s) ICAL support

## Deployment

Example Docker Compose configuration:

```yml
services:
    api:
        image: weebify/easistent-tt:latest
        ports:
            - 127.0.0.1:8888:3000
        restart: unless-stopped
        environment:
            - PORT=3000
            - SCHOOL_ID=182
            - SCHOOL_KEY=30a1b45414856e5598f2d137a5965d5a4ad36826
```

## Scuff

Easistent sometimes dies, but docker restarting can get you IP banned.
To avoid this exponential backoff is implemented.

To customize the file location set `BACKOFF_STATE_FILE`.

Easistent is also racist (towards german IPs), so you can set:

- `HTTP_PROXY`
- `HTTPS_PROXY`
- `SOCKS5_PROXY`
- `SOCKS_PROXY`

to make requests from a different IP.


LP in Lep Pozdrav
\- Matic