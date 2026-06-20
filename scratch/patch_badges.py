import os
import re

src_dir = 'client/src'

replacements = [
    ('PostCard.jsx', r'<VerifiedBadge size="sm" tier={post.user\?\.premiumTier} />', r'<VerifiedBadge size="sm" tier={post.user?.premiumTier} role={post.user?.role} />'),
    ('SearchDropdown.jsx', r'<VerifiedBadge size="xs" tier={u\.premiumTier} />', r'<VerifiedBadge size="xs" tier={u.premiumTier} role={u.role} />'),
    ('StoryViewer.jsx', r'<VerifiedBadge size="xs" />', r'<VerifiedBadge size="xs" role={currentGroup.user?.role} />'),
    ('UserCard.jsx', r'<VerifiedBadge size="sm" tier={user\.premiumTier} />', r'<VerifiedBadge size="sm" tier={user.premiumTier} role={user.role} />'),
    ('BrandTools.jsx', r'<VerifiedBadge size="xs" />', r'<VerifiedBadge size="xs" role={c.role} />'),
    ('Chat.jsx', r'<VerifiedBadge size="sm" tier={partner\.premiumTier} />', r'<VerifiedBadge size="sm" tier={partner.premiumTier} role={partner.role} />'),
    ('Profile.jsx', r'<VerifiedBadge size="lg" tier={user\.premiumTier} />', r'<VerifiedBadge size="lg" tier={user.premiumTier} role={user.role} />'),
    ('UserProfile.jsx', r'<VerifiedBadge size="lg" tier={profile\.premiumTier} />', r'<VerifiedBadge size="lg" tier={profile.premiumTier} role={profile.role} />'),
    ('UsersList.jsx', r'<VerifiedBadge size="xs" tier={user\.premiumTier} />', r'<VerifiedBadge size="xs" tier={user.premiumTier} role={user.role} />')
]

for filename, pattern, repl in replacements:
    filepath = None
    # find the file
    for root, dirs, files in os.walk(src_dir):
        if filename in files:
            filepath = os.path.join(root, filename)
            break
            
    if filepath:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = re.sub(pattern, repl, content)
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Patched {filename}')
        else:
            print(f'No changes made to {filename} (pattern not found)')
