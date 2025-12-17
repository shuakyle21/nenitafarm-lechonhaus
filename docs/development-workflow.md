# Development Workflow Guide

This guide describes how to develop features using our "Supabase Environment" setup (Production vs Development) and GitHub Actions.

## The Cycle: feature -> PR (Preview) -> main (Production)

### 1. Start a New Feature

Always branch off `main`. Do not work directly on `main`.

```bash
# Update your local main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/my-new-feature
```

### 2. Develop Locally

- Ensure you have `.env.development` set up.
- Run `npm run dev`.
- This connects to your **Development** Supabase project (`rms-dev`).
- Make your code changes.
- If you make database changes, run them on `rms-dev` via Supabase Dashboard.

### 3. Push and Preview (Staging)

When you are ready to test in a "live-like" environment:

```bash
git add .
git commit -m "feat: added new awesome feature"
git push origin feature/my-new-feature
```

**Open a Pull Request (PR) on GitHub:**

1.  Go to the repository on GitHub.
2.  Click **"Compare & pull request"**.
3.  Set the base to `main`.
4.  Create the PR.

**What happens next?**

- GitHub Actions detects the `pull_request` event.
- It sets the environment to **Staging** (uses `rms-dev` database).
- It deploys a **preview URL** (you'll see a bot comment with the link).
- **Test this URL.** It is your code running in the cloud, connected to your Dev database.

### 4. Merge to Production

If the preview looks good:

1.  **Sync Database**: If you made SQL changes in Dev, apply them to **Production** (`Restaurant-Management-System`) now via Supabase Dashboard.
2.  **Merge**: Click **"Merge pull request"** on GitHub.

### 5. Deploy to Live VPS

Since you host your live site on a VPS:

1.  Pull the latest `main` branch to your local machine:
    ```bash
    git checkout main
    git pull origin main
    ```
2.  Run your deployment script:
    ```bash
    ./deploy.sh
    ```
    _This script automatically uses `.env.production` because `vite build` runs in production mode by default._

### Summary

- **Local & PR** = Uses `rms-dev` DB.
- **Merged (Main)** = Uses `Restaurant-Management-System` DB.
- **Deploy** = `./deploy.sh` builds using `Restaurant-Management-System` config.
