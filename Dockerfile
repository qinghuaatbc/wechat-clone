FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY wechat-clone-linux ./wechat-clone
COPY web-react/dist ./web-react/dist

EXPOSE 8080
CMD ["./wechat-clone"]
