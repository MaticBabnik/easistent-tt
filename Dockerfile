FROM oven/bun:debian AS build

ARG NODE_ENV=production

RUN apt-get update && apt-get install -y git 

WORKDIR /app

COPY package.json .

RUN ["bun", "i"]

COPY . .

RUN ["bun", "build", "--target=bun", "src/index.ts", "--outfile=index.js"]

FROM oven/bun:slim

WORKDIR /app

COPY package.json .
COPY --from=build /app/index.js .

EXPOSE 3000
ENV PORT=3000
ENV SCHOOL_ID=182
ENV SCHOOL_KEY="30a1b45414856e5598f2d137a5965d5a4ad36826"

CMD [ "bun", "run", "/app/index.js" ]
