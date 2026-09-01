# easistent-tt

eAsistent public timetable scraper. Checkout the sister project [easistent-tt-client](https://github.com/maticbabnik/easistent-tt-client).

## Features

- Fetch all events for a given week
- Integrates with calendar apps via http(s) ICAL support

## Configuration

| Key                   | Default                | Description                                                   |
|-----------------------|------------------------|---------------------------------------------------------------|
| `PORT`                | 3000                   | Port number for the API server                                |
| `SCHOOL_ID`           | /                      | eAsistent school id (small-ish int)                           |
| `SCHOOL_KEY`          | /                      | eAsistent school "key"/"secret" (random looking string)       |
| `BACKOFF_STATE_FILE`  | `.backoff-state.json`  | File to store backoff state for startup retries               |
| `NODE_ENV`            | `production` in docker | Backoff is exponential in `production` and constant otherwise |
| `UA_MSG`              | `:3`                   | Custom user agent message for requests                        |  


## Deployment

Example Docker Compose configuration (school 182 is Vegova)

```yml
services:
  api:
    image: ghcr.io/maticbabnik/maticbabnik/easistent-tt:latest
    restart: unless-stopped

    environment:
      - PORT=3000
      - SCHOOL_ID=182
      - SCHOOL_KEY=30a1b45414856e5598f2d137a5965d5a4ad36826
      - BACKOFF_STATE_FILE=/backoff.json

    volumes:
      - ./backoff.json:/backoff.json

    expose: [ 3000 ]

```