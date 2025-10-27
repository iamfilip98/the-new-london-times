# Sudoku Championship Setup Guide

## 🔐 Secure Authentication System
- **Login URL**: Visit `auth.html` first
- **Authentication**: Database-backed with bcrypt password hashing
- **Setup Users**: Run `node init-users.js` to create user accounts
- **Environment Variables**: Set `FAIDAO_PASSWORD` and `FILIP_PASSWORD` for custom passwords
- **Default Passwords**: Available during initial setup (should be changed in production)

## 📊 GitHub Data Persistence

To enable automatic data syncing to GitHub (recommended for production):

### 1. Create a Data Repository
1. Create a new GitHub repository named `sudoku-champion-data` (or your preferred name)
2. Make it public or private (your choice)
3. Initialize with a README if desired

### 2. Generate a Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Sudoku Championship Data Sync"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories) - if your data repo is public
5. Click "Generate token" and copy it immediately (you won't see it again)

### 3. Configure the Application
1. Open `js/github-sync.js`
2. Update these variables:
   ```javascript
   this.owner = 'YOUR_GITHUB_USERNAME'; // Replace with your actual username
   this.repo = 'sudoku-champion-data'; // Replace if you used a different name
   ```

### 4. Set up Environment Variables (Vercel)
If deploying to Vercel:
1. In your Vercel dashboard, go to your project settings
2. Add an environment variable:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your personal access token from step 2
3. Redeploy your application

### 5. Local Development
For local development, the app will use localStorage only and won't sync to GitHub.

## 🏆 Features

### New Achievements Added
- **Speed Racer**: Complete Easy under 1 minute
- **Marathon Runner**: Take over 30 minutes on Hard
- **Triple Threat**: Complete all 3 difficulties in under 15 minutes total
- **Night Owl**: Submit results after 11 PM
- **Early Bird**: Submit results before 7 AM
- **Weekend Warrior**: Win both Saturday and Sunday
- **Clutch Performer**: Win by exactly 1 point
- **Daily Dominator**: Win with 2x opponent's score
- **Consistency King**: Have all 3 difficulties within 10% of each other
- **DNF Survivor**: Win despite having a DNF
- **Learning Experience**: Make 20+ errors in a single day
- **Perfectionist Week**: Complete 7 consecutive days with 0 total errors

### Accessibility Improvements
- ✅ High contrast focus indicators
- ✅ Improved text contrast for better readability
- ✅ Minimum touch target sizes for mobile (44px)
- ✅ Reduced motion support for users who prefer it
- ✅ Better keyboard navigation
- ✅ Screen reader friendly

### Mobile Improvements
- ✅ Fixed burger menu functionality
- ✅ Improved mobile touch targets
- ✅ Better responsive design

### Visual Improvements
- ✅ Hidden scrollbars (functionality preserved)
- ✅ Player-specific achievement borders:
  - 🔴 Red border: Faidao has more unlocks
  - 🔵 Teal border: Filip has more unlocks
  - 🟡 Yellow border: Tied or default
- ✅ Achievement player tracking and counts

## 🔧 Technical Notes

### Data Structure
The app stores two main data types:
- **Entries**: Daily competition results
- **Achievements**: Unlocked achievements with player attribution

### Sync Behavior
- **Development**: Uses localStorage only
- **Production**: Syncs to GitHub + localStorage backup
- **Conflict Resolution**: GitHub data takes precedence, newer local data is preserved

### Time Input Format
The app now accepts both formats:
- Raw seconds: `280` (4 minutes 40 seconds)
- MM:SS format: `4:40`

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set the environment variable `GITHUB_TOKEN`
3. Deploy!

### Manual Deployment
1. Build/prepare your files
2. Upload to your hosting provider
3. Ensure `auth.html` is accessible
4. Configure GitHub sync if desired

## 🎮 Usage

1. Visit your deployed URL
2. You'll be redirected to `auth.html`
3. Select your player and enter your password
4. Start competing and tracking achievements!
5. Data automatically syncs to database in production

## 🛠️ Customization

### Adding New Achievements
1. Edit `js/achievements.js`
2. Add new achievement definitions to the array
3. Implement corresponding check functions
4. Test thoroughly!

### Changing Players
Update player names in:
- `js/achievements.js` (player arrays)
- CSS color variables in `css/main.css`
- Any hardcoded references in the codebase

### Styling
- Primary colors: Edit CSS variables in `css/main.css`
- Layout: Modify the CSS Grid and Flexbox layouts
- Animations: Adjust transition durations and effects

---

🏆 **Ready to compete!** The championship arena awaits your sudoku battles!