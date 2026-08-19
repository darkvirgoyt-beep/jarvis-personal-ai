FROM node:22-alpine

RUN addgroup -S virgoyt && adduser -S virgoyt -G virgoyt
WORKDIR /workspace
COPY scripts/virgoyt-cli.mjs /usr/local/bin/virgoyt
RUN chmod 0555 /usr/local/bin/virgoyt
USER virgoyt
ENTRYPOINT ["node", "/usr/local/bin/virgoyt"]
CMD ["doctor"]
