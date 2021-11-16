# Builder
FROM node:16

LABEL maintainer="dev@ambire.com"

WORKDIR /ambire-wallet

# Install `serve` for running as static server
RUN npm install -g serve

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000


ENV PRIVATE_KEY=
ENV PORT=
ENV MONGO_URL=
ENV MONGO_DB_NAME=
# set to any email source configured in Amazon SES, in order to enable notification emails; See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html on how to load AWS credentials; recommended value is hello@adex.network
ENV EMAIL_SOURCE=
# AWS region
ENV AWS_REGION=

# For npm run monitor only:
ENV WALLET_ADDR=
ENV PUSHOVER_USER=
ENV PUSHOVER_TOKEN=

# build and run production server
CMD [ "npm", "run", "build" ]

ENTRYPOINT [ "serve", "-s", "build" ]