# Group Chat Web Application

A *single-page* group chat web application with
asynchronous Javascript and a REST API written in Python with Flask.

The application lets users start group chats and invite their 
friends. 


# key features:
- One-click signup creates a new user in the database and returns an API key for that user. Store 
  the API key in the user's browser, so that it is available across tabs and if the browser window 
  is closed and reopened. A javascript logout function removes the API key from where it is stored 
  on the user's browser and reloads the page.
- Login API endpoint that accepts a username and password (either in the headers or request body, 
  but **not** in the URL) and returns the API key for that user. All other API endpoints require a 
  valid API key.
- Make all HTTP requests after the page load with `fetch` calls to API endpoints that return JSON. 
  Prefix API routes with `/api`.
- Users can update their name and password, create and rename rooms, and post messages.
- Visiting a screen pushes its URL to the navigation bar and the browser history. Rooms have their own unique URLs.
- Opening `/`, `/login`, or `/profile` in a new browser window opens the app to those screens.
- Opening the url for a room opens the app to that room. You may choose to encode the room id in 
  whichever part of the URL makes the most sense to you.
- Opening a url while logged out loads the login page, and then returns the user to that url after they log in.
- Users can use the browser Back and Forward buttons to navigate the app.
- While in a room, poll the API every 0.1 seconds for new messages. Stop polling after the user leaves a room.