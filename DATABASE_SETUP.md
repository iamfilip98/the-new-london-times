# Database Setup Instructions

## Vercel PostgreSQL Database Setup

1. **Create Vercel Project**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Add PostgreSQL Database**
   - Go to your Vercel dashboard
   - Navigate to your project
   - Go to the "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose your region
   - Click "Create"

3. **Configure Environment Variables**
   After creating the database, Vercel will automatically add these environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

5. **Database Initialization**
   The database tables will be automatically created when the first API request is made to `/api/entries`, `/api/achievements`, or `/api/stats`.

## Database Schema

The following tables will be created automatically:

### entries
- `id` (SERIAL PRIMARY KEY)
- `date` (DATE UNIQUE)
- `data` (JSONB) - Contains faidao and filip data
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### achievements
- `id` (SERIAL PRIMARY KEY)
- `achievement_id` (VARCHAR)
- `player` (VARCHAR)
- `unlocked_at` (TIMESTAMP)
- `data` (JSONB)
- `created_at` (TIMESTAMP)

### streaks
- `id` (SERIAL PRIMARY KEY)
- `player` (VARCHAR UNIQUE)
- `current_streak` (INTEGER)
- `best_streak` (INTEGER)
- `updated_at` (TIMESTAMP)

### challenges
- `id` (SERIAL PRIMARY KEY)
- `challenge_id` (VARCHAR UNIQUE)
- `data` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Data Migration

The application will automatically migrate existing localStorage data to the database on the first load. This includes:
- All entry data
- Achievement data
- Streak data
- Challenge data

After successful migration, localStorage data will be cleared.

## Local Development

For local development, you'll need to set up environment variables. Create a `.env.local` file:

```
POSTGRES_URL="your_postgres_connection_string"
```

## API Endpoints

- `GET /api/entries` - Get all entries
- `POST /api/entries` - Save new entry or migrate data
- `DELETE /api/entries?date=YYYY-MM-DD` - Delete entry
- `GET /api/achievements` - Get all achievements
- `POST /api/achievements` - Save achievement
- `GET /api/stats?type=streaks|challenges` - Get stats
- `PUT /api/stats` - Update streaks
- `POST /api/stats` - Save challenge