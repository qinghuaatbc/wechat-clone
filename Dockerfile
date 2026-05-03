FROM node:20-alpine AS frontend-builder

WORKDIR /app/web-react
COPY web-react/package.json web-react/package-lock.json ./
RUN npm ci
COPY web-react/ .
RUN npm run build

FROM golang:1.25-alpine AS builder

ENV GOTOOLCHAIN=auto

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o wechat-clone ./cmd/server/

FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/wechat-clone .
COPY --from=frontend-builder /app/web-react/dist ./web-react/dist

EXPOSE 8080
CMD ["./wechat-clone"]
