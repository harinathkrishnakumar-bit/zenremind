
# ZenRemind: Simple Setup Guide (Non-Tech Version)

Follow these steps exactly to get your personal reminder system running for free.

## Step 1: Get your AI Key (The "Brain")
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **"Create API Key"**.
3. Copy that long code (the Key). Keep it safe.

## Step 2: Create your GitHub Repository (The "Home")
1. Sign in to [GitHub.com](https://github.com/).
2. Click the **"+"** icon at the top right and choose **"New repository"**.
3. Name it `zenremind`.
4. Select **"Private"** (this keeps your data and key safer).
5. Click **"Create repository"**.

## Step 3: Upload the Files
1. In your new repository, look for the link that says **"uploading an existing file"**.
2. Drag and drop all the files from this project into the box.
3. Wait for them to finish, then scroll down and click **"Commit changes"**.
   *Note: Make sure the `.github` folder and its contents are included!*

## Step 4: Add your AI Key to GitHub (The "Secret")
*This allows the app to use the AI without showing your key to the public.*
1. In your GitHub repository, click the **"Settings"** tab at the top.
2. On the left sidebar, click **"Secrets and variables"**, then click **"Actions"**.
3. Click the green button: **"New repository secret"**.
4. **Name**: `API_KEY` (must be exactly this).
5. **Secret**: Paste your long key from Step 1 here.
6. Click **"Add secret"**.

## Step 5: Activate the Website
1. Click the **"Actions"** tab at the top of your GitHub page.
2. You should see a yellow or green circle spinning. This is GitHub "building" your app. Wait 2-3 minutes until it turns into a green checkmark.
3. Go to **Settings > Pages**.
4. Under "Build and deployment" > "Branch", click the dropdown that says "None" and choose **`gh-pages`** (this appears automatically after Step 5.2 finishes).
5. Click **"Save"**.
6. At the top of the Pages screen, you will see a link like `https://username.github.io/zenremind/`. That is your app!

## Step 6: Install on Android (The "App")
1. Open **Chrome** on your Android phone or tablet.
2. Type in your website link from Step 5.
3. Tap the **three dots (⋮)** in the top-right corner of Chrome.
4. Tap **"Install app"** (or "Add to Home Screen").
5. Now, ZenRemind will be on your home screen like a real app!

---
**Tip:** Your data is stored only on your phone/tablet browser. If you clear your browser history/cache, your reminders will disappear, so use the "Export Backup" button in the Dashboard occasionally!
