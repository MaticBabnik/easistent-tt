FROM node:17-alpine

RUN ["mkdir", "/app"]

WORKDIR /app

COPY package.json .

RUN ["npm", "i"] 

COPY . .

EXPOSE 8080
ENV SCHOOL_ID=182
ENV SCHOOL_PUBLIC_KEY="30a1b45414856e5598f2d137a5965d5a4ad36826"

CMD [ "npm", "run", "start" ]