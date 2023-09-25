FROM debian:10-slim AS build

ARG NODE_ENV=production

RUN apt-get update && apt-get install -y git unzip curl bash

RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.0.0"

WORKDIR /app

COPY package.json .

RUN ["/root/.bun/bin/bun", "i"]

COPY . .

RUN ["/root/.bun/bin/bun", "build", "--target=bun", "src/index.ts", "--outfile=index.js"]

FROM oven/bun:1.0

WORKDIR /app

COPY package.json .
COPY --from=build /app/index.js .

EXPOSE 3000
ENV PORT=3000
ENV SCHOOL_ID=182
ENV SCHOOL_KEY="30a1b45414856e5598f2d137a5965d5a4ad36826"

CMD [ "bun", "run", "/app/index.js" ]