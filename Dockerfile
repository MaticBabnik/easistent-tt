FROM oven/bun:1.0

WORKDIR /app

COPY package.json .

RUN ["bun", "i"] 

COPY . .

EXPOSE 3000
ENV PORT=3000
ENV SCHOOL_ID=182
ENV SCHOOL_KEY="30a1b45414856e5598f2d137a5965d5a4ad36826"

CMD [ "bun", "run", "/app/src/index.ts" ]