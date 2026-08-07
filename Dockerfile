# Local development image for the Astro blog + Decap local backend.
# Production deployment remains on Netlify; this image is only for `docker compose up`.
FROM node:22

WORKDIR /app

# Install exact dependencies first so layer caching survives source edits.
COPY package.json package-lock.json ./
RUN npm ci

# Runtime source is bind-mounted from the host; ports match the local dev
# convention (4321 = Astro, 4322 = Decap local backend).
EXPOSE 4321 4322

CMD ["npm", "run", "dev"]