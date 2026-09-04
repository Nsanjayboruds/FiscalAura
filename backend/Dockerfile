FROM golang:1.22-bookworm AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server .

FROM debian:bookworm-slim
# Install poppler-utils for PDF extraction
RUN apt-get update && apt-get install -y poppler-utils ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 3001
CMD ["./server"]
