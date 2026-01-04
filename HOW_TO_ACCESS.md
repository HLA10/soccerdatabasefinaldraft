# How to Access Your Deployed Application

## 1. Find Your Netlify URL

Your site is live at your Netlify deployment URL. You can find it in:

### Option A: Netlify Dashboard
1. Go to your Netlify Dashboard
2. Click on your site
3. Look at the top - you'll see your site URL
   - Format: `https://your-site-name.netlify.app` or a custom domain

### Option B: Check Deployment Logs
1. In Netlify Dashboard → Your Site → Deploys
2. Click on the latest successful deployment
3. The URL is shown at the top

## 2. Access Your Application

Once you have the URL, simply:
1. Open the URL in your browser
2. You'll see your homepage with:
   - Sign In button (if not logged in)
   - Sign Up button (if not logged in)
   - Go to Dashboard button (if logged in)

## 3. First Steps

1. **Sign Up/Sign In:**
   - Click "Sign Up" to create an account
   - Or "Sign In" if you already have one
   - Use email magic link or social login (if configured in Clerk)

2. **Access Dashboard:**
   - After signing in, you'll be redirected or can click "Go to Dashboard"
   - Use the sidebar to navigate:
     - Create Team
     - Create Player
     - Create Match
     - Add Match Stats
     - Send Invite
     - My Invites
     - Admin Panel (if you're an ADMIN)

## 4. Important Notes

- **Default User Role:** New users are created with "SCOUT" role by default
- **Admin Access:** To access Admin Panel, you need to manually change a user's role to "ADMIN" (you can do this through the database or create an admin user directly)
- **Team Creation:** Only ADMIN or COACH roles can create teams

