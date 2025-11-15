1. Once the images are uploaded at step 5, user has to select a cover photo(decide proper flow and way to view the photos or image names to select the cover) this should be optional, if user is not selected any cover photo select random cover photo and update information is project section. from project section also studio user can modify the cover photo by selecting it. - (Partially finished by implementing pagination)
2. Add profile picture for client while client creation and if user selects new client while new project creation, it should be optional. that profile picture should be reflected in the clients. analyse clients page, projects creation form details, new client creation details. studio user should able modify the profile picture anytime so give edit option is client page. - (finished)
3. Projects search bar not working, sort by status and date not working.(finsihed)
4. we had a retry button for every image upload if failed, find that enabled it if we had it, else add a new retry button for failed images while uploading.(not finished)
5. For project, we might be selected the package, so based on that it should generate the invoice. so add small generate invoice button in the projects page on every page and inside the projects also, based on the package it should get the package amount from defined package and generate invoice and should be downloadble and shareble, once the invoice generated pop up should open where download button and share button should be there. when user selects share button it should list whatsapp or email share which is configured in the client details, in future backend will call whatsapp or email to send message, it user select email and it is not configured for client toast should raise saying email is not configured same all other communications. don't tie with whatsapp and email, treat it as communications. (Finished)
6. Exiting edit package should prefilled the existing package details in edit pop-up, currently it pop-ups with zero details in services page. - (finished)
7. Remove Manage button from projects page - (finished)
8. all and unread button's card is overlaying the notifications in notification page - (finished)
9. while typing in all forms typing box, there is an outer border comes which looks odd, so need to modernize all the forms.- (partially finished)
10. In Studio general settings a photo and description section, this is for updating the about page of client facing page. analyse the client's page about page and this in settings of studio login, editable photo section, about description box, Add another options for Studio display image for showing studio image in brands place. show studio related general informations in the studio section, give option to set defualt invoice type from existing presets - (finished)
11. After clicking Save invoice from invoice, it should redirect to invoice page. - (finished)

12. When we click the view gallery from the studio page, (finished)

    1. it directly goes and list all the photos for the project, but it should actually go that album section of the project page. (finished)
    2. from there if we click the gallery from header, it shows all projects albums for all clients, it should be show only the alnums for that particular albums for particular project of particular client, so understand the hierarchy. (finished)
    3. we had a back button flow implemented find that implement it back for gallery page which clicked from studio projects Page.(finished)
       for all above understand the backend and frontend code, categories it, plan well and do the change, don't break other flows.

13. once we save the projects, the cover photo is updated in the projects box. And if we see the gallery, immediately cover for the albums are also updated. but when we refresh the page cover photo for projects are not visible, seems it is using placeholder and same for gallery albums cover also removed using placeholder. Same for selecting cover photo after refresh it says No photos available in this project. so studio user be able to select the data for cover photos. understand the backend and frontend code, categories it, plan well and do the change, don't break other flows.(finished)

14. In Clients page, total projects count for the client is 0, get the count of the project from backend API somehow and update. understand the backend and frontend code, categories it, plan well and do the change, don't break other flows. get the data in best possible way and follow industry best practice and reduce api calls.(finished)

15. Remove manage button from clients page.(finished)

16. if there is no image for the clients, set it random images, which the github and mobile contacts and others app are doing like palceholder profile picture (finished)

17.when we click select photo to continue from the store, the photos are not listed there to select, it just a empty screen.(finished)

18. once the client is created, using there mailid and generate random password, map that to that client, client should login using the mailid and password to see the projects and client facing galleries, check if the we having this feature in backend API or frontent API. understand that and implement. based exisiting users in DB, using their mailId and set OldClient as password update the DB. same update the client of the demo credential. plan and act - (finished)

19. In clients page, if we click any one client , we have projects cards where all the projects where listed, but it has to clickable, if user clicks anyone the project it should redirect to the specific project page.(finished)

20. Back button is not working in gallery page, when we are in store or, topNav Bar gallery page.
21. when we click the projects from the clients page then if click the back button, it is going to actual projects page, but it should come to the specific clients page where we actually entered into it

---

22. When we click the store in the view gallery and select any one prints and click select photos, it is showing some common photos for all the projects view gallery, but it has to show only the photos that is relavant to that particular project, so make that happen, by properly plan and understand the exisiting code, make use of photos from cache, if is not available then take it from backend. - (fixed)

23. when we click the store from view gallery, it is giving some prints cards from the backend, for which it taking the photos from unsplash which is failing, so understand the every products prints in the store, get the relevant photos from the internet proper image and store in the backend and In the frontend get it from the backend. - (Not fixed)

24. If we click the download button from the image viewer, the image opens in same page, it has to be downloaded automatically without opning as new page or tab, check all the browser support and plan to do it properly - (http://localhost:8000/uploads/projects/7/20251108_173248_GNHpkbL4_2160C_rear.jpg - CORS error )

25. When we click comment in the image viewer, comments side panel comes from the right side but it hides the comment button, fav button, download button, close button, all the button in the image viewer right side of top corner it hidding this element - <div class="flex items-center gap-2 sm:gap-4"><button class="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Pause slideshow"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5"></path></svg></button><button class="p-2 rounded-full hover:bg-white/20 transition-colors " aria-label="Select"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg></button><button class="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Favorite"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path></svg></button><button class="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Download"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"></path></svg></button><button class="p-2 rounded-full hover:bg-white/20 transition-colors relative" aria-label="Comments"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"></path></svg></button><button class="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button></div> - it has to move properly to the left as how image is moving. - (Fixed)

26. Fav, selections button in the image viewer is not making the calls to backend and update the DB, find whether it is provisioned, if it is not do the neccessary things. use existing code for indexedDb or cache and modify the backend and DB if neccessary - (fixed)

27. layouts and brands pages can't be scroll down. (Fixed)

28. there is a dot on the fav button, remove that. (Fixed)

29. In Manual Mapping , once the photo is selected it changes like files mapped and moved to remaingng files, what if user mistakenly selected the wrong image, they have to select the correct one right? how will you design the UI for that, with great UX?, user should know which photo they have selected for which old photo.

30. find how industries are show in the cover photo , make the same changes in the projects also, currently cover photo is big

31. the editted photos are updating the photos i think, for ddfdfgdsf project, initially project image count is 101, after i added multiple editted photos, the total image count is 115, it should be replace the existing images using editted image right, that's why we are mapping it right, backend should maintain in the version hierachy right. can you check the backend and frontend plan for fix in industries best practice - (Fixed)

32. what is the use of this <span class="text-sm font-bold text-slate-800">0 files</span>, it always stays zero find the reason fix it, otherwise remove it
