FROM node:16.15.0-bullseye AS frontend-builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY public ./public
COPY src ./src
COPY index.html \
     .eslintignore \
     .eslintrc.cjs \
     .prettierrc \
     postcss.config.js \
     quasar.config.js \
     tsconfig.json \
     ./
RUN yarn run quasar build --mode spa


FROM caddy:2.5.1

# hadolint ignore=DL3018
RUN apk --no-cache add curl

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend-builder /usr/src/app/dist/spa /site

COPY docker-healthcheck.sh /usr/local/bin/
HEALTHCHECK CMD [ "/usr/local/bin/docker-healthcheck.sh" ]
