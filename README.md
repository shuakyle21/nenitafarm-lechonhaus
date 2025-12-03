<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yFtQWgwRIlXR4o-2Ca64ywjORdU1OuIZ

## ⚠️ SECURITY NOTICE

**IMPORTANT**: Before running this application, please read [SECURITY_NOTICE.md](SECURITY_NOTICE.md) for critical security information.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env`:
   `cp .env.example .env`
3. Set your Supabase credentials in `.env`:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - **IMPORTANT**: Never share or commit your `.env` file
   - On Unix/Linux systems, restrict file permissions: `chmod 600 .env`
4. Run the app:
   `npm run dev`

## Production Deployment

For production deployments:
1. Use secure environment variable management (GitHub Secrets, etc.)
2. Never commit the `.env` file
3. Change default passwords in the database
4. Review and enable Row Level Security policies in Supabase
