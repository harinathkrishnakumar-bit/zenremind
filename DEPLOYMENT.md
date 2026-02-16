# ZenRemind - Deployment Guide

Complete guide to deploy your ZenRemind app to Vercel with Supabase cloud sync.

---

## 🎯 Overview

This setup will give you:
- ✅ **Free hosting** on Vercel
- ✅ **Free database** with Supabase (500MB storage, 50k monthly active users)
- ✅ **Cloud sync** across all your devices
- ✅ **Automatic backups** with Supabase
- ✅ **Email magic link** authentication

---

## Step 1: Set Up Supabase (Free Database)

### 1.1 Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create a New Project
1. Click "New Project"
2. Fill in the details:
   - **Name**: `zenremind` (or any name you like)
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be ready ☕

### 1.3 Get Your Credentials
1. In your Supabase project dashboard, click "Settings" (gear icon in sidebar)
2. Click "API" in the settings menu
3. Copy these two values (you'll need them soon):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 1.4 Set Up Database Tables
1. Click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the file `supabase-setup.sql` from your project folder
4. Copy ALL the SQL code and paste it into the SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned" - this is perfect! ✅

### 1.5 Configure Email Authentication
1. Go to "Authentication" → "Providers" in Supabase
2. Find "Email" and make sure it's enabled
3. Under "Email Auth", turn ON "Enable email confirmations" if you want extra security
4. Scroll down and add your Vercel domain to "Site URL" (we'll get this in Step 2)
   - For now, you can use `http://localhost:5173`
   - We'll update this after deploying to Vercel

---

## Step 2: Deploy to Vercel

### 2.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### 2.2 Push Code to GitHub (if not already)
```bash
# Initialize git if you haven't already
git init
git add .
git commit -m "Initial commit with Supabase integration"

# Create a new repository on GitHub.com
# Then push your code:
git remote add origin https://github.com/YOUR_USERNAME/zenremind.git
git branch -M main
git push -u origin main
```

### 2.3 Import Project to Vercel
1. On Vercel dashboard, click "Add New..." → "Project"
2. Click "Import" next to your `zenremind` repository
3. Configure the project:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (should be pre-filled)
   - **Output Directory**: `dist` (should be pre-filled)

### 2.4 Add Environment Variables
**IMPORTANT:** Before clicking "Deploy", add your Supabase credentials:

1. Click "Environment Variables" section
2. Add these two variables:

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Paste your Supabase Project URL (from Step 1.3)
   - Environment: Production, Preview, Development (check all)

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Paste your Supabase anon public key (from Step 1.3)
   - Environment: Production, Preview, Development (check all)

3. Click "Deploy"
4. Wait 2-3 minutes for deployment ⏳

### 2.5 Get Your App URL
1. Once deployed, you'll see "Congratulations! 🎉"
2. Click "Visit" or copy the URL (looks like: `https://zenremind-xxx.vercel.app`)
3. **Save this URL!**

---

## Step 3: Update Supabase Settings

### 3.1 Add Vercel URL to Supabase
1. Go back to your Supabase project
2. Click "Authentication" → "URL Configuration"
3. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`
4. Click "Save"

---

## Step 4: Test Your App! 🎉

### 4.1 Open Your App
1. Go to your Vercel URL: `https://your-app.vercel.app`
2. You should see the ZenRemind dashboard

### 4.2 Test Cloud Sync
1. On the Dashboard, find the "☁️ Cloud Sync" card
2. Enter your email address
3. Click "Send Link"
4. Check your email for the magic link
5. Click the link in the email
6. You should be logged in with a green "✓ Synced" status

### 4.3 Test Multi-Device Sync
1. Open the app on your phone: `https://your-app.vercel.app`
2. Log in with the same email
3. Add a reminder on your phone
4. Go back to your desktop browser
5. Refresh the page - your reminder should appear! 🎊

---

## Step 5: Install as Mobile App (Optional)

### On Android:
1. Open your Vercel URL in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to Home Screen"
3. Confirm - now it's on your home screen like a native app!

### On iPhone/iPad:
1. Open your Vercel URL in Safari
2. Tap the Share button (□↑)
3. Tap "Add to Home Screen"
4. Confirm - it's now on your home screen!

---

## Local Development Setup

Want to develop locally? Here's how:

### 1. Clone and Install
```bash
git clone https://github.com/YOUR_USERNAME/zenremind.git
cd zenremind
npm install
```

### 2. Create Local Environment File
```bash
# Create .env.local file
cp .env.example .env.local
```

### 3. Add Your Supabase Credentials
Edit `.env.local` and add:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key...
```

### 4. Run Development Server
```bash
npm run dev
```

Open `http://localhost:5173` in your browser!

---

## Troubleshooting

### App loads but Cloud Sync doesn't work
- ✅ Check environment variables in Vercel are set correctly
- ✅ Verify Supabase URL in Vercel matches your project URL
- ✅ Make sure you ran the SQL setup script in Supabase

### Email magic link doesn't arrive
- ✅ Check your spam folder
- ✅ Verify email provider is enabled in Supabase Authentication settings
- ✅ Try a different email address

### Data doesn't sync between devices
- ✅ Make sure you're logged in with the same email on both devices
- ✅ Try refreshing the page
- ✅ Check browser console for errors (F12)

### Build fails on Vercel
- ✅ Make sure `package.json` has all dependencies
- ✅ Check that `vite.config.ts` exists
- ✅ Verify Node version (Vercel uses Node 18 by default)

### "Supabase credentials not found" error
- ✅ Environment variables must start with `VITE_` for Vite to expose them
- ✅ Redeploy after adding environment variables
- ✅ Clear browser cache and refresh

---

## Cost Breakdown

### Completely FREE Plan:
- **Vercel**:
  - ✅ 100 GB bandwidth/month
  - ✅ Unlimited deployments
  - ✅ Automatic HTTPS
  - ✅ Custom domains

- **Supabase**:
  - ✅ 500MB database storage
  - ✅ 50,000 monthly active users
  - ✅ 5GB bandwidth
  - ✅ Unlimited API requests
  - ✅ 50,000 monthly auth users

**This is more than enough for personal use!**

---

## Updating Your App

When you make code changes:

### Method 1: Git Push (Recommended)
```bash
git add .
git commit -m "Your update message"
git push
```
Vercel will automatically detect the push and redeploy! ✨

### Method 2: Manual Redeploy
1. Go to Vercel dashboard
2. Click your project
3. Go to "Deployments"
4. Click "..." on latest deployment → "Redeploy"

---

## Security Best Practices

1. ✅ **Never commit `.env.local`** to Git (it's in `.gitignore`)
2. ✅ **Use different Supabase projects** for development and production
3. ✅ **Enable email confirmation** in Supabase for extra security
4. ✅ **Regularly backup** your Supabase database (Settings → Database → Backups)
5. ✅ **Keep dependencies updated**: run `npm update` monthly

---

## Next Steps

### Optional Enhancements:
- 🔔 Add push notifications with Vercel + Supabase webhooks
- 📧 Customize email templates in Supabase Auth
- 🎨 Add your custom domain to Vercel
- 📊 Set up Vercel Analytics
- 🌙 Enable Supabase real-time subscriptions for instant sync

---

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Review Supabase logs: Project → Logs
3. Check Vercel deployment logs: Project → Deployments → Click deployment
4. Open browser console (F12) for client-side errors

---

**Congratulations! 🎉 Your ZenRemind app is now live with cloud sync!**

Share your deployment URL with friends and access it from any device!
