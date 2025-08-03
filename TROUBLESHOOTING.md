# 🚨 Troubleshooting Guide - Blank White Screen Issue

## 🎯 **THE MAIN ISSUE: Missing Environment Variables**

Your app is showing a blank white screen because **environment variables are missing**. This is a critical configuration issue that affects both local development and Netlify deployment.

## 🔧 **IMMEDIATE FIXES**

### **1. Local Development Fix**

Run this command to create your `.env` file:
```bash
./setup-env.sh
```

Then edit the `.env` file and replace the placeholder values:
```env
REACT_APP_SUPABASE_URL=https://dhhsmadffhlztiofrvjf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
REACT_APP_RESEND_API_KEY=your_actual_resend_api_key
```

### **2. Netlify Deployment Fix**

1. Go to your Netlify dashboard
2. Click on your site
3. Go to **Site settings** → **Environment variables**
4. Add these 3 variables:
   - `REACT_APP_SUPABASE_URL` = `https://dhhsmadffhlztiofrvjf.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = `[Your actual Supabase anon key]`
   - `REACT_APP_RESEND_API_KEY` = `[Your actual Resend API key]`
5. Click **Save** and **Trigger deploy**

## 🔍 **DIAGNOSIS TOOLS**

### **Environment Diagnostic Component**
The app now includes a diagnostic component that shows:
- ✅ Green indicator when environment is OK
- ❌ Red indicator with specific missing variables
- 🔗 Direct links to get your API keys

### **Browser Console Check**
Open browser console (F12) and look for:
- ❌ "Missing Supabase environment variables" errors
- ❌ "Configuration error" messages
- ✅ No environment-related errors when fixed

## 🚨 **COMMON CAUSES OF BLANK WHITE SCREEN**

### **1. Missing Environment Variables (Most Common)**
- **Symptom**: Blank white screen, no error messages
- **Cause**: Supabase client fails to initialize
- **Fix**: Add environment variables (see above)

### **2. JavaScript Errors**
- **Symptom**: Blank white screen with console errors
- **Cause**: Runtime JavaScript errors
- **Fix**: Check browser console for specific errors

### **3. Build Issues**
- **Symptom**: Build fails or incomplete
- **Cause**: Compilation errors
- **Fix**: Run `npm run build` locally to check for errors

### **4. Network Issues**
- **Symptom**: App loads but features don't work
- **Cause**: CORS or network connectivity issues
- **Fix**: Check Supabase project settings and network connectivity

## 🛠️ **DEBUGGING STEPS**

### **Step 1: Check Environment Variables**
```bash
# Run the setup script
./setup-env.sh

# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
npm start
```

### **Step 2: Check Browser Console**
1. Open your app in browser
2. Press F12 to open developer tools
3. Go to Console tab
4. Look for any red error messages
5. Check for environment variable errors

### **Step 3: Test Local Build**
```bash
# Build the app locally
npm run build

# Check for build errors
# If successful, the build/ folder should contain your app
```

### **Step 4: Check Netlify Build Logs**
1. Go to Netlify dashboard
2. Click on your site
3. Go to **Deploys** tab
4. Click on the latest deploy
5. Check build logs for errors

## 🔑 **GETTING YOUR API KEYS**

### **Supabase Anon Key**
1. Go to: https://supabase.com/dashboard
2. Select your project: `dhhsmadffhlztiofrvjf`
3. Click **Settings** → **API**
4. Copy the **anon public** key (starts with `eyJ...`)

### **Resend API Key**
1. Go to: https://resend.com/api-keys
2. Create new API key or copy existing
3. Copy the key (starts with `re_...`)

## ✅ **SUCCESS INDICATORS**

Your app is working when:
- ✅ App loads without blank white screen
- ✅ Login page appears (if not authenticated)
- ✅ Dashboard appears (if authenticated)
- ✅ No console errors about missing environment variables
- ✅ Environment diagnostic shows green "Environment OK"

## 🆘 **STILL HAVING ISSUES?**

If you're still seeing a blank white screen:

1. **Check the diagnostic component** - it should show specific missing variables
2. **Check browser console** - look for specific error messages
3. **Verify API keys** - ensure they're copied correctly with no extra spaces
4. **Test locally first** - make sure it works locally before deploying
5. **Check Netlify build logs** - look for build-time errors

## 📞 **NEED MORE HELP?**

If the issue persists:
1. Share the specific error messages from browser console
2. Share the Netlify build logs
3. Confirm you've added all 3 environment variables
4. Test with a fresh browser cache (Ctrl+Shift+R)

---

**Remember**: The blank white screen is almost always caused by missing environment variables. Once you add them correctly, your app should work perfectly! 🚀 