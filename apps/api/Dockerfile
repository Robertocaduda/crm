FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy monorepo structure
COPY package*.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all workspace dependencies
RUN npm ci

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Bundle API (esbuild resolves @crm/db and @crm/shared path aliases)
RUN cd apps/api && npm run build

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "cd packages/db && npx prisma migrate deploy && cd /app && node apps/api/dist/index.js"]
