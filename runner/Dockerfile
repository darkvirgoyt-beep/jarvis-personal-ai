FROM node:22-alpine

WORKDIR /opt/virgoyt
COPY scripts/virgoyt-cli.mjs ./virgoyt-cli.mjs
RUN addgroup -S virgoyt && adduser -S virgoyt -G virgoyt && chown -R virgoyt:virgoyt /opt/virgoyt
USER virgoyt

ENTRYPOINT ["node", "/opt/virgoyt/virgoyt-cli.mjs"]
CMD ["status"]
