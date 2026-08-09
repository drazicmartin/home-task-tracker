FROM alpine:latest

ARG PB_VERSION=0.39.10

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase (linux/amd64 — this targets a regular x86_64 server, not ARM)
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# schema-as-code: applied automatically on `serve` startup
COPY ./pb_migrations /pb/pb_migrations

COPY ./docker-entrypoint.sh /pb/docker-entrypoint.sh
RUN chmod +x /pb/docker-entrypoint.sh

EXPOSE 8090

ENTRYPOINT ["/pb/docker-entrypoint.sh"]

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]