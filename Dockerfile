FROM node:14

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
COPY . .

RUN yarn install
RUN npm install -g serve
RUN yarn build

CMD serve -s ./build -p 3000
