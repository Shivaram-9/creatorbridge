[ignoring loop detection]
# WORK LOG: DAY 14
**Name**: YANDAMURI MOHANA VENKATA SHIVARAM  
**Role**: Full Stack Developer  
**Project**: CreatorBridge (Influencer & Brand Collaboration Platform)  
**Work Log Date**: 18-05-2026  
**Day Count**: Day – 14 Cover Photo Upload Integration and Mobile Layout Refinements  

## EXECUTIVE SUMMARY  
Today’s development cycle focused on implementing the highly requested Cover Photo upload feature and resolving critical alignment issues in the mobile viewport. We successfully added database support and API endpoints for cover photos, and updated the UI to allow seamless uploading. Additionally, we fixed the mobile layout of the notifications dropdown and profile page to ensure a professional and centered presentation across all devices.

## KEY ACHIEVEMENTS & FEATURES  
### 1. Cover Photo Upload System  
*   **Backend Infrastructure**: Added a `cover` field to the User model and created a dedicated `/api/users/me/cover` endpoint. We also increased the file size limit to **10MB** using a custom uploader to support high-resolution cover images without server rejection.
*   **Frontend Integration**: Added file input triggers and upload handlers to the Profile page, allowing users to update their cover photo dynamically with live toast feedback.
*   **Placeholder Fallback**: Implemented an external placeholder image fallback to avoid 404 errors for missing local assets while no cover is set.

### 2. Mobile Layout & Alignment Corrections  
*   **Centered Notifications**: Solved the issue of notifications cutting off or shifting to the right on mobile by using robust absolute positioning (`left: 0`, `right: 0`, `margin: 0 auto`).
*   **Profile Page Overflow Fix**: Reduced container and content padding on mobile from 20px to 10px to prevent the content from overflowing and shifting the entire page layout to the right.
*   **Stats Grid Optimization**: Balanced the profile stats cards into a clean 2x2 grid on mobile for better visual structure instead of an uneven flow.

### 3. Notification Filtering  
*   **Removed Fake Alerts**: Added a frontend filter to exclude repeated "1000 views" milestone notifications, ensuring users only see relevant interactions in their dropdown.

## DEPLOYMENT & RENDER PIPELINE HISTORY (DAY 14)  
Here is the complete log of deployments and builds triggered today to push these updates live:

*   **Deploy live for `8051d32`**: fix: Center mobile notifications with margin auto and reduce profile padding on mobile (May 18, 2026 at 5:57 PM)
*   **Deploy started for `8051d32`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 5:56 PM)
*   **Deploy live for `8051d32`**: May 18, 2026 at 3:31 PM (Rollback)
*   **Deploy started for `8051d32`**: New commit via Auto-Deploy (May 18, 2026 at 3:30 PM)
*   **Deploy live for `6c98e47`**: fix: Increase cover upload limit to 10MB and use separate middleware (May 18, 2026 at 2:20 PM) (Rollback)
*   **Deploy started for `6c98e47`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 2:19 PM)
*   **Deploy live for `6c77934`**: fix: Use external placeholder for cover image (May 18, 2026 at 1:46 PM) (Rollback)
*   **Deploy started for `6c77934`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 1:46 PM)
*   **Deploy live for `6c77934`**: May 18, 2026 at 1:36 PM (Rollback)
*   **Deploy started for `6c77934`**: New commit via Auto-Deploy (May 18, 2026 at 1:36 PM)
*   **Deploy live for `6aa1719`**: fix: Add cover upload, center mobile notifications, filter fake notifs, and fix mobile stats grid (May 18, 2026 at 1:29 PM) (Rollback)
*   **Deploy started for `6aa1719`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 1:29 PM)
*   **Deploy live for `6aa1719`**: May 18, 2026 at 1:14 PM (Rollback)
*   **Deploy started for `6aa1719`**: New commit via Auto-Deploy (May 18, 2026 at 1:14 PM)
*   **Deploy live for `c14b5db`**: fix: Fix sidebar links, widen desktop view, restore posting, and fix avatar ratio (May 18, 2026 at 12:55 PM)
*   **Deploy started for `c14b5db`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 12:55 PM)
*   **Deploy live for `c14b5db`**: May 18, 2026 at 12:39 PM
*   **Deploy started for `c14b5db`**: New commit via Auto-Deploy (May 18, 2026 at 12:38 PM)
*   **Deploy live for `eb5b744`**: fix: Revert API URL to fix CORS error (May 18, 2026 at 12:07 PM)
*   **Deploy started for `eb5b744`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 12:07 PM)
*   **Deploy live for `eb5b744`**: May 18, 2026 at 12:04 PM
*   **Deploy started for `eb5b744`**: New commit via Auto-Deploy (May 18, 2026 at 12:04 PM)
*   **Deploy live for `feb56a6`**: feat: Redesign home page with carousel and sidebars (May 18, 2026 at 12:00 PM)
*   **Deploy started for `feb56a6`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 12:00 PM)
*   **Deploy live for `feb56a6`**: May 18, 2026 at 11:55 AM
*   **Deploy started for `feb56a6`**: New commit via Auto-Deploy (May 18, 2026 at 11:54 AM)
*   **Deploy live for `d17105a`**: Fix: Used React Portal to guarantee centering of notifications on mobile (May 18, 2026 at 10:29 AM)
*   **Deploy started for `d17105a`**: New commit via Auto-Deploy (May 18, 2026 at 10:29 AM)
*   **Deploy live for `14105c0`**: Fix: Centered notifications dropdown on mobile (May 18, 2026 at 10:17 AM)
*   **Deploy started for `14105c0`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 10:17 AM)
*   **Deploy live for `14105c0`**: May 18, 2026 at 10:09 AM
*   **Deploy started for `14105c0`**: New commit via Auto-Deploy (May 18, 2026 at 10:09 AM)
*   **Deploy live for `c7e7e31`**: Fix: Added hardcoded fallbacks to Chat styles to bypass CSS caching (May 18, 2026 at 9:12 AM)
*   **Deploy started for `c7e7e31`**: Manually triggered by you via Dashboard (Build cache cleared) (May 18, 2026 at 9:12 AM)

## FINAL OUTCOME (DAY-14)  
Day 14 has significantly improved the usability and professional feel of the platform on mobile devices. By fixing the alignment issues and delivering the cover photo feature with a higher size allowance, we have provided creators with better customization tools and a smoother, glitch-free interface.

## FOR VERIFYING:  
1. **GitHub Repo**: `https://github.com/Shivaram-9/creatorbridge.git`  
2. **Production Website**: `https://creatorbridge-myeo.onrender.com`  
