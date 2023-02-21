# syntax=docker/dockerfile:1.3

FROM --platform=$BUILDPLATFORM node:18.14.1 AS frontend-builder

WORKDIR /usr/src/app

ENV YARN_CACHE_FOLDER=/var/cache/yarn
COPY .npmrc package.json yarn.lock ./
RUN --mount=type=cache,target=/var/cache/yarn \
    --mount=type=secret,id=GHP_AUTH_TOKEN \
    GHP_AUTH_TOKEN=$(cat /run/secrets/GHP_AUTH_TOKEN) yarn install

COPY public ./public
COPY src ./src
COPY index.html \
     .eslintignore \
     .eslintrc.js \
     .prettierrc \
     postcss.config.js \
     quasar.config.js \
     tsconfig.json \
     ./
RUN --mount=type=secret,id=GHP_AUTH_TOKEN \
    GHP_AUTH_TOKEN=$(cat /run/secrets/GHP_AUTH_TOKEN) yarn run quasar build --mode spa


FROM caddy:2.6.4

# hadolint ignore=DL3018
RUN apk --no-cache add curl

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend-builder /usr/src/app/dist/spa /site

COPY docker-healthcheck.sh /usr/local/bin/
HEALTHCHECK CMD [ "/usr/local/bin/docker-healthcheck.sh" ]
