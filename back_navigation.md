Client Flow:

Login → Albums (no back)
→ Click Album → Cover (NO back button - full screen)
→ View Gallery → Gallery/Folders (back appears)
→ Back → Albums ✅ (skips cover)

Studio Flow:
Dashboard → Project Details
→ View Gallery → Cover (NO back button - full screen)
→ View Gallery → Gallery (back appears)
→ Back → Project Details ✅ (skips cover)

         → View Gallery → Cover (NO back button)
                       → View Gallery → Folders (back appears)
                                     → Gallery (back appears)
                                     → Back → Folders
                       → Back → Project Details ✅ (skips cover)


Technical Implementation:
Navigation Stack Example:

Select Album: stack = ['albums', 'cover'], page = 'cover'
Click View Gallery: stack = ['albums', 'cover', 'gallery'], page = 'gallery'
Click Back:
Pops 'gallery' → previous is 'cover'
Detects 'cover' → pops it too → previous is 'albums'
Goes to 'albums' directly
