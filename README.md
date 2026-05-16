# Impossible Performance — Workout Tracker

## Deploy in 4 Steps

### Step 1 — Install dependencies
Make sure you have [Node.js](https://nodejs.org) installed (v18 or later).

Open a terminal in this folder and run:
```
npm install
```

### Step 2 — Test locally (optional)
```
npm run dev
```
Open http://localhost:5173 in your browser to confirm it works.

### Step 3 — Push to GitHub
1. Go to [github.com](https://github.com) and create a free account if you don't have one
2. Click **New repository**, name it `impossible-performance`, keep it private
3. Run these commands in this folder:
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/impossible-performance.git
git push -u origin main
```

### Step 4 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **Add New → Project**
3. Select your `impossible-performance` repository
4. Leave all settings as default and click **Deploy**
5. In ~60 seconds you'll get a live link like:
   `https://impossible-performance.vercel.app`

Share that link with your client — it works on any phone or browser.
They can add it to their iPhone home screen: **Safari → Share → Add to Home Screen**

---

## Giving your client access
Just send them the Vercel URL. That's it. No login, no app store.

To add it as an app icon on iPhone:
1. Open the link in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

It will appear on their home screen and open fullscreen like a native app.

---

## Making updates
Edit any file locally, then run:
```
git add .
git commit -m "Update"
git push
```
Vercel will automatically redeploy within 30 seconds.
