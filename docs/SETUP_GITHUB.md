# Setting Up Your GitHub Repository

This guide will help you push your Nstyle project to GitHub.

## Prerequisites

- Git installed on your machine
- GitHub account
- Project files ready in your local directory

## Step-by-Step Guide

### 1. Initialize Git Repository

If you haven't already initialized git in your project:

```bash
cd /path/to/nail-glam-social-main
git init
```

### 2. Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `nstyle` (or your preferred name)
   - **Description**: "Social platform for nail art enthusiasts"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### 3. Add Files to Git

```bash
# Add all files to staging
git add .

# Verify what will be committed
git status

# Create your first commit
git commit -m "Initial commit: Nstyle social platform"
```

### 4. Connect to GitHub Repository

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/nstyle.git

# Verify remote was added
git remote -v
```

### 5. Push to GitHub

```bash
# Push to main branch
git push -u origin main

# If your default branch is 'master', use:
# git push -u origin master
```

### 6. Set Up GitHub Pages (Optional)

To deploy your app using GitHub Pages:

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Select "main" (or "master") branch
6. Select "/ (root)" folder
7. Click "Save"

### 7. Add Secrets for GitHub Actions (Optional)

If you want to use GitHub Actions for CI/CD:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

### 8. Create Development Branch

It's good practice to work on a development branch:

```bash
# Create and switch to dev branch
git checkout -b development

# Push dev branch to GitHub
git push -u origin development
```

## Common Git Commands

```bash
# Check status
git status

# Add specific files
git add src/components/NewComponent.tsx

# Commit with message
git commit -m "feat: add new component"

# Push changes
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Merge branch
git merge feature/new-feature
```

## Recommended Git Workflow

1. **Main/Master Branch**: Production-ready code
2. **Development Branch**: Integration branch for features
3. **Feature Branches**: Individual features (`feature/user-profile`)
4. **Bugfix Branches**: Bug fixes (`bugfix/login-issue`)

## Commit Message Convention

Follow conventional commits for clear history:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```bash
git commit -m "feat: add user profile page"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update README with setup instructions"
```

## Protecting Your Secrets

**IMPORTANT**: Never commit sensitive information!

- The `.gitignore` file is configured to exclude `.env` files
- Always use environment variables for sensitive data
- Double-check before committing: `git status`

## Troubleshooting

### Permission Denied

If you get a permission denied error:
```bash
# Use SSH instead of HTTPS
git remote set-url origin git@github.com:YOUR_USERNAME/nstyle.git

# Or use personal access token
# Go to GitHub → Settings → Developer settings → Personal access tokens
```

### Large Files

If you have large files:
```bash
# Install Git LFS
git lfs track "*.psd"
git add .gitattributes
```

### Wrong Branch Name

If your default branch is 'master' but GitHub expects 'main':
```bash
# Rename branch
git branch -m master main
git push -u origin main
```

## Next Steps

1. Set up branch protection rules
2. Add collaborators if working in a team
3. Set up CI/CD with GitHub Actions
4. Configure project settings (issues, discussions, etc.)
5. Add topics to make your repository discoverable

## Resources

- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Actions](https://github.com/features/actions)
- [GitHub Pages](https://pages.github.com/)

---

Happy coding! 🎨💅