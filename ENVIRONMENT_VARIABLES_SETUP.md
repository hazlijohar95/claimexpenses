# 🔧 Environment Variables Setup Guide

## 🎯 **QUICK SETUP FOR NETLIFY**

### **Step 1: Get Your API Keys**

#### **Supabase Anon Key:**
1. Go to: https://supabase.com/dashboard
2. Select your project: `https://dhhsmadffhlztiofrvjf.supabase.co`
3. Click **Settings** → **API**
4. Copy the **anon public** key (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### **Resend API Key:**
1. Go to: https://resend.com/api-keys
2. Create new API key or copy existing
3. Copy the key (looks like: `re_1234567890...`)

### **Step 2: Set Variables in Netlify**

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Click your site name**
3. **Go to Site settings** (top tab)
4. **Click Environment variables** (left sidebar)
5. **Click "Add a variable"**

### **Step 3: Add These 3 Variables**

| Variable Name | Value |
|---------------|-------|
| `REACT_APP_SUPABASE_URL` | `https://dhhsmadffhlztiofrvjf.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `[Your Supabase anon key]` |
| `REACT_APP_RESEND_API_KEY` | `[Your Resend API key]` |

### **Step 4: Save and Deploy**

1. **Click "Save"** after adding each variable
2. **Go to Deploys** tab
3. **Click "Trigger deploy"** → **Deploy site**
4. **Wait for build to complete**

## 🔍 **VERIFICATION STEPS**

### **After Deployment:**

1. **Open your Netlify URL**
2. **Open browser console** (F12)
3. **Check for errors** - should see no environment-related errors
4. **Test login** - should work with your Supabase auth
5. **Test magic link** - should send emails via Resend

### **Common Issues:**

#### **❌ "Environment variable not found"**
- Check variable names (case-sensitive)
- Ensure no extra spaces
- Verify you clicked "Save"

#### **❌ "Supabase connection failed"**
- Verify Supabase URL is correct
- Check anon key is copied completely
- Ensure no extra characters

#### **❌ "Resend API error"**
- Verify Resend API key is correct
- Check key starts with `re_`
- Ensure key has proper permissions

## 📱 **VISUAL GUIDE**

### **Netlify Dashboard Navigation:**
```
Netlify Dashboard
├── Your Site Name
    ├── Site settings
        ├── Environment variables
            ├── Add variable
                ├── Key: REACT_APP_SUPABASE_URL
                ├── Value: https://dhhsmadffhlztiofrvjf.supabase.co
                ├── Save
                ├── Add variable
                ├── Key: REACT_APP_SUPABASE_ANON_KEY
                ├── Value: [Your anon key]
                ├── Save
                ├── Add variable
                ├── Key: REACT_APP_RESEND_API_KEY
                ├── Value: [Your Resend key]
                └── Save
```

## 🚀 **TESTING YOUR SETUP**

### **Quick Test Script:**
```javascript
// Open browser console on your Netlify site
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
console.log('Resend Key exists:', !!process.env.REACT_APP_RESEND_API_KEY);
```

### **Expected Output:**
```
Supabase URL: https://dhhsmadffhlztiofrvjf.supabase.co
Supabase Key exists: true
Resend Key exists: true
```

## 🔒 **SECURITY NOTES**

- ✅ **Never commit API keys** to Git
- ✅ **Use Netlify's environment system**
- ✅ **Keys are encrypted** in Netlify
- ✅ **Only visible** to site owners

## 📞 **NEED HELP?**

If you're still having issues:

1. **Check Netlify build logs** for errors
2. **Verify all 3 variables** are set correctly
3. **Test locally** with `npm start` first
4. **Check browser console** for specific errors

## 🎉 **SUCCESS INDICATORS**

Your setup is working when:
- ✅ Site loads without blank page
- ✅ Login page appears
- ✅ No console errors about missing env vars
- ✅ Authentication works
- ✅ Magic link emails are sent

**Your Cynclaim app should now work perfectly on Netlify! 🚀** 