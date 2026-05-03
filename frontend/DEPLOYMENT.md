# Deployment Guide

## Quick Start

This guide covers deploying the Mess Management Platform frontend to various hosting platforms.

## Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications with zero configuration.

### Option 1: Via GitHub

1. Push your repository to GitHub
2. Visit [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Add environment variables in the settings
5. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Vercel)

In your Vercel project settings, add:
```
NEXT_PUBLIC_API_URL=https://your-nestjs-api.com/api
```

## Docker

### Build Docker Image

```bash
# Create Dockerfile (if not exists)
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
EOF
```

### Build and Run

```bash
# Build image
docker build -t mess-management-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-api.com/api \
  mess-management-frontend
```

### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:3000/api
    depends_on:
      - api

  api:
    image: mess-api:latest
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/mess
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mess
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with: `docker-compose up`

## AWS

### AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Configure hosting
amplify add hosting
# Choose "Hosting with Amplify Console" and "Continuous deployments (Git-based deployments)"

# Deploy
amplify publish
```

### AWS EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-instance.amazonaws.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd mess-management-frontend

# Install and build
npm install
npm run build

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start npm --name "mess-app" -- start

# Enable startup on reboot
pm2 startup
pm2 save
```

## Google Cloud Platform (GCP)

### Cloud Run

```bash
# Create app.yaml
cat > app.yaml << 'EOF'
runtime: nodejs18

env: standard

env_variables:
  NEXT_PUBLIC_API_URL: "https://your-api.com/api"

handlers:
  - url: /.*
    script: auto
EOF

# Deploy
gcloud app deploy
```

### Cloud Build (from GitHub)

1. Connect your GitHub repo in Google Cloud Console
2. Create a `cloudbuild.yaml`:

```yaml
steps:
  # Build
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
  
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
  
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/mess-frontend:$SHORT_SHA'
      - '.'
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/mess-frontend:$SHORT_SHA'
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - '-f=k8s/'
      - '-i=$PROJECT_ID'
      - '-l=gcr.io/$PROJECT_ID/mess-frontend:$SHORT_SHA'

images:
  - 'gcr.io/$PROJECT_ID/mess-frontend:$SHORT_SHA'
```

## Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

Or connect your GitHub repo directly in Netlify dashboard.

## Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create mess-management-frontend

# Set environment variables
heroku config:set NEXT_PUBLIC_API_URL=https://your-api.com/api

# Deploy
git push heroku main
```

## DigitalOcean App Platform

1. Connect your GitHub repository
2. Click "Create App"
3. Select your repository
4. Add build command: `npm run build`
5. Add run command: `npm start`
6. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.com/api
   NODE_ENV=production
   ```
7. Deploy

## Best Practices

### Security

1. **Use HTTPS**: Always use HTTPS in production
2. **Set CSP Headers**: Configure Content Security Policy
3. **Environment Variables**: Never commit sensitive data
4. **CORS**: Configure CORS properly on your API backend
5. **Rate Limiting**: Implement rate limiting on the backend

### Performance

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Let Next.js handle code splitting
3. **Caching**: Set appropriate cache headers
4. **CDN**: Use a CDN for static assets
5. **Monitoring**: Use tools like Sentry for error tracking

### Monitoring

```bash
# Add Sentry
npm install @sentry/nextjs

# Add monitoring in pages
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Loading

1. Verify variable names (must start with `NEXT_PUBLIC_` for client-side)
2. Redeploy after setting variables
3. Check `.env.local` for local testing

### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS headers on backend
3. Ensure API is accessible from deployment region
4. Check browser DevTools for network errors

## Monitoring & Logs

### Vercel
- View logs in Vercel dashboard → Settings → Functions
- Real-time logs available in `vercel logs`

### Docker
```bash
# View logs
docker logs -f container_name

# Docker Compose
docker-compose logs -f frontend
```

### Cloud Run
```bash
# View logs
gcloud run logs read mess-app --limit 50
```

---

Choose the deployment platform that best fits your infrastructure needs and team workflow!
