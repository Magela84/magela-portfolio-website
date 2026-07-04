# Azure Engineer Portfolio Website

Personal portfolio site for **Magela Bobby Akinola** — a mid-level Azure Cloud Engineer
specializing in networking & infrastructure, DevOps & CI/CD, Kubernetes/containers, and
data & storage solutions.

Built as a single, dependency-free `index.html` (HTML + CSS + JS) with a clean, modern
dark theme, a light/dark toggle, and a fully responsive layout.

## Sections
- **Hero / landing** — profile photo, name, and headline
- **About** — background and core focus areas
- **Projects** — Azure builds with architecture diagrams, tech-stack badges, and GitHub links
- **Skills** — Azure services, IaC, DevOps tools, and containers
- **Certifications** — Microsoft Azure certifications
- **Contact** — Formspree-powered form plus email and social links

## Run locally
No build step. Either:
- Double-click `index.html`, **or**
- Serve the folder: `python -m http.server 8000` then open <http://localhost:8000>

## Customize
- **Profile photo** — add `profile.jpg` to the folder (replaces the initials avatar)
- **Résumé** — replace `resume.pdf` with your own
- **Contact form** — set your Formspree ID in the form's `action` URL
- **Links** — update the LinkedIn and GitHub URLs

## Deploy
Works on any static host — GitHub Pages, Netlify, Cloudflare Pages, or Vercel.
