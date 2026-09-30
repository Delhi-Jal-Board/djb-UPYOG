FROM delhijalboard/alpine-node-builder-18:yarn AS build

ARG WORK_DIR=.

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV GENERATE_SOURCEMAP="false"

RUN apk add --no-cache git

COPY ${WORK_DIR} .

RUN cd web \
   && node envs.js \
   && yarn install --frozen-lockfile \
   && cd micro-ui-internals/packages/libraries && yarn build && cd ../../.. \
   && cd micro-ui-internals/packages/react-components && yarn build && cd ../../.. \
   && cd micro-ui-internals/packages/modules/common && yarn build && cd ../../../.. \
   && cd micro-ui-internals/packages/modules/core && yarn build && cd ../../../.. \
   && yarn build

FROM nginx:mainline-alpine

ENV WORK_DIR=/var/web/digit-ui

RUN mkdir -p ${WORK_DIR}

COPY --from=build /app/web/build ${WORK_DIR}/

COPY --from=build \
   /app/web/docker/nginx.conf \
   /etc/nginx/conf.d/default.conf
