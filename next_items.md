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

12. When we click the view gallery from the studio page,

    1. it directly goes and list all the photos for the project, but it should actually go that album section of the project page.
    2. from there if we click the gallery from header, it shows all projects albums for all clients, it should be show only the alnums for that particular albums for particular project of particular client, so understand the hierarchy.
    3. we had a back button flow implemented find that implement it back for gallery page which clicked from studio projects Page.
       for all above understand the backend and frontend code, categories it, plan well and do the change, don't break other flows.

13. once we save the projects, the cover photo is updated in the projects box. And if we see the gallery, immediately cover for the albums are also updated. but when we refresh the page cover photo for projects are not visible, seems it is using placeholder and same for gallery albums cover also removed using placeholder. Same for selecting cover photo after refresh it says No photos available in this project. so studio user be able to select the data for cover photos. understand the backend and frontend code, categories it, plan well and do the change, don't break other flows.

14. In Clients page, total projects count for the client is 0, get the count of the project from backend API somehow and update. understand the backend and frontend code, categories it, plan well and do the change, don't break other flows. get the data in best possible way and follow industry best practice and reduce api calls.

15. Remove manage button from clients page.

16. if there is no image for the clients, set it random images, which the github and mobile contacts and others app are doing like palceholder profile picture

17.when we click select photo to continue from the store, is the photos are not listed there, it just a empty screen
