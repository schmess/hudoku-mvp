# Hudoku (Half Sudoku) Web App

## 🚀 Quick Start: Private Hosting with GitHub + Vercel

This guide will help you deploy your Hudoku app online with a private link using GitHub and Vercel (free for personal use).

---

## 1. Push Your Code to GitHub
1. Create a **private** repository on [GitHub](https://github.com/new).
2. Push your code:
   ```sh
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin master
   ```

---

## 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up (use GitHub login for easiest setup).
2. Click **"Add New Project"** and import your private GitHub repo.
3. For a static site (like this), Vercel will auto-detect and deploy your `index.html`.
4. After deployment, you'll get a unique `.vercel.app` link (e.g., `https://your-hudoku.vercel.app`).

---

## 3. Make Your Link Private
- By default, the link is unlisted (not indexed by Google), but anyone with the link can access it.
- For extra privacy:
  - In your Vercel project settings, go to **"Password Protection"** and set a password for preview deployments.
  - Or, only share the link with trusted people.

---

## 4. Updating Your Site
- Push changes to GitHub, and Vercel will auto-update your site.

---

## 5. (Optional) Remove from Search Engines
- Vercel sites are not indexed by default, but you can add a `robots.txt` with:
  ```
  User-agent: *
  Disallow: /
  ```
  to block all crawlers.

---

## 6. Need Help?
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Docs](https://docs.github.com/en)

---

Enjoy your private Hudoku web app! 🎉 