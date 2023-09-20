// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

// Custom validation on the password reset fields
const repeatPassword = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password").value;
  const r = repeatPassword.value;
  return p == r;
}
repeatPassword.addEventListener("input", (event) => {
  if (repeatPasswordMatches()) {
    repeatPassword.setCustomValidity("");
  } else {
    repeatPassword.setCustomValidity("Password doesn't match");
  }
});

// On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

const isLoggedIn = localStorage.getItem('api_Key') !== null;
const path = window.location.pathname;

window.addEventListener("load", () => {
  if ((path === "/login" || path === "/profile" || path.startsWith("/room")) && !isLoggedIn) {
    SPLASH.style.display = "none";
    PROFILE.style.display = "none";
    LOGIN.style.display = "block";
    ROOM.style.display = "none";
  } else if (path === "/" || (path === "/login" && isLoggedIn)) {
    SPLASH.style.display = "block";
    PROFILE.style.display = "none";
    LOGIN.style.display = "none";
    ROOM.style.display = "none";
  } else if (path === "/profile"  && isLoggedIn) {
    SPLASH.style.display = "none";
    PROFILE.style.display = "block";
    LOGIN.style.display = "none";
    ROOM.style.display = "none";
  } else if (path.startsWith("/room")) {
    SPLASH.style.display = "none";
    PROFILE.style.display = "none";
    LOGIN.style.display = "none";
    ROOM.style.display = "block";
  } else {
    window.location.replace("/404");
  }
})

// When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder.

document.querySelector('.failed').style.display = "none";
if (isLoggedIn) {
  document.querySelector('.loggedIn').style.display = "block";
  document.querySelector('.hero').querySelector('.create').style.display = "block";
  document.querySelector('.hero').querySelector('.gotoProfile').style.display = "block";
  document.querySelector('.hero').querySelector('.exitlogout').style.display = "block";
  document.querySelector('.splashHeader').querySelector('.loggedIn').querySelector('.username').style.display = "block";
  document.querySelector('.loggedOut').style.display = "none";
  document.querySelector('.hero').querySelector('.signup').style.display = "none";
  document.querySelector('.splashHeader').querySelector('.loggedIn').querySelector('.username').innerText = 'Welcome back, ' + localStorage.getItem('username') + '!';
  document.querySelector('.profile').querySelector('.loggedIn').querySelector('.username').innerText = localStorage.getItem('username');
  document.querySelector('.profile').querySelector('.alignedForm').querySelector('input[name=username]').value = localStorage.getItem('username');
  document.querySelector('.profile').querySelector('.alignedForm').querySelector('input[name=password]').value = localStorage.getItem('password');
  document.querySelector('.profile').querySelector('.alignedForm').querySelector('input[name=repeatPassword]').value = localStorage.getItem('password');
  document.querySelector('.room').querySelector('.loggedIn').querySelector('.username').innerText = localStorage.getItem('username');
} else {
  document.querySelector('.loggedOut').style.display = "block";
  document.querySelector('.hero').querySelector('.signup').style.display = "block";
  document.querySelector('.loggedIn').style.display = "none";
  document.querySelector('.hero').querySelector('.create').style.display = "none";
  document.querySelector('.hero').querySelector('.gotoProfile').style.display = "none";
  document.querySelector('.hero').querySelector('.exitlogout').style.display = "none";
  document.querySelector('.splashHeader').querySelector('.loggedIn').querySelector('.username').style.display = "none";
}


//  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to history
function signup() {
  console.log('sign up')
  fetch('/api/signup', {
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
  }).then((response) => {
    if (response.status != 200) { throw new Error("bad request"); }
    return response.json();
  }).then((json) => {
    console.log(json)
    localStorage.setItem('userid', json.userID);
    localStorage.setItem('username', json.userName);
    localStorage.setItem('password', json.passWord);
    localStorage.setItem('api_Key', json.apiKey);
    window.location = '/profile'
    window.history.pushState(null, null, '/profile');
  }).catch((error) => {
    console.error(error);
  });
}

function logout() {
  localStorage.removeItem('api_Key');
  localStorage.removeItem('userid');
  localStorage.removeItem('username');
  localStorage.removeItem('password')
  window.location = '/';
  window.history.pushState(null, null, '/');
}

function login() {
  let loginUsername = document.querySelector('.login').querySelector('input[name=username]').value;
  let loginPassword = document.querySelector('.login').querySelector('input[name=password]').value;
  fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({inputUsername: loginUsername, inputPassword: loginPassword})
  }).then((response) => {
      if (response.status != 200) { throw new Error("bad request"); }
      return response.json();
  }).then((json) => {
    if (json.result === 'success') {
      localStorage.setItem('userid', json.userID);
      localStorage.setItem('username', loginUsername);
      localStorage.setItem('password', loginPassword);
      localStorage.setItem('api_Key', json.apiKey);
      window.location = '/profile'
      window.history.pushState(null, null, '/profile');
    } else if (json.result === 'fail') {
      document.querySelector('.failed').style.display = "block";
    }
  }).catch((error) => {
    console.error(error);
  });
}

function changeUsername() {
  let returnInfo = document.querySelector('.profile').querySelector('.profileReturnInfo');
  returnInfo.innerHTML = ''
  let newUsername = document.querySelector('.profile').querySelector('input[name=username]').value.trim();
  if (newUsername === '') {
    returnInfo.innerText = "Input new username is empty!";
  } else if (newUsername === localStorage.getItem('username')) {
    returnInfo.innerText = "Input new username is same as original username!";
  } else {
    fetch('/api/changeUsername/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 
        'API-Key': localStorage.getItem('api_Key')},
      body: JSON.stringify({inputNewUsername: newUsername})
    }).then((response) => {
      if (response.status === 200) {
        localStorage.setItem('username', newUsername);
        returnInfo.innerText = "username changes successfully";
      }
    }).catch((error) => {
      console.error(error);
    });
  }
}

function changePassword() {
  let returnInfo = document.querySelector('.profile').querySelector('.profileReturnInfo');
  returnInfo.innerHTML = ''
  let newPassword = document.querySelector('.profile').querySelector('input[name=password]').value.trim();
  let repeatNewPassword = document.querySelector('.profile').querySelector('input[name=repeatPassword]').value;
  if (newPassword != repeatNewPassword) {
    returnInfo.innerText = "Passwords don't match!";
  } else if (newPassword === '') {
    returnInfo.innerText = "Input new password is empty!";
  } else if (newPassword === localStorage.getItem('password')) {
    returnInfo.innerText = "Input new password is same as original password!";
  } else {
    fetch('/api/changePassword/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 
        'API-Key': localStorage.getItem('api_Key')},
      body: JSON.stringify({inputNewPassword: newPassword})
    }).then((response) => {
      if (response.status === 200) {
        localStorage.setItem('password', newPassword);
        returnInfo.innerText = "Password changes successfully";
      }
    }).catch((error) => {
      console.error(error);
    });
  }
}

if (isLoggedIn) {
  getRooms();
} else {
  document.querySelector('.splash').querySelector('h2').innerText = '';
  document.querySelector('.splash').querySelector('.rooms').innerHTML = '';
}

function getRooms() {
  console.log('get all rooms');
  let roomContainer = document.querySelector('.splash').querySelector('.roomList')
  roomContainer.innerHTML = '';
  fetch('/api/getRooms/', {
    method: 'GET',
    headers: {'Content-Type': 'application/json', 
        'API-Key': localStorage.getItem('api_Key')}
  }).then((response) => {
    if (response.status != 200) { throw new Error("bad request"); }
    return response.json();
  }).then((json) => {
    console.log(json)
    if(json.length != 0){
      document.querySelector('.splash').querySelector('.rooms').querySelector('.noRooms').style.display = "none";
      json.forEach(room => {
        roomContainer.innerHTML += "<a href = /rooms/" + room.roomId + ">"  + room.roomId + "<strong> " + room.roomName + "</strong></a>\n";
      })
    }
  }).catch((error) => {
    console.error(error);
  });
}

function createRoom() {
  console.log('create a rooms');
  fetch('/api/createRoom/', {
    method: 'GET',
    headers: {'Content-Type': 'application/json', 
        'API-Key': localStorage.getItem('api_Key')}
  }).then((response) => {
    if (response.status != 200) { throw new Error("bad request"); }
    return response.json();
  }).then((json) => {
    window.location = '/rooms/' + json.newRoomID;
    window.history.pushState(null, null,  '/rooms/' + json.newRoomID);
  }).catch((error) => {
    console.error(error);
  });
}

function getRoomInfo() {
  console.log('get room info');
  let roomId = window.location.pathname.split('/').pop();
  document.querySelector('.room').querySelector('.roomDetail').querySelector('.inviteRoomURL').innerText = '/rooms/' + roomId;
  fetch('/api/getRoomInfo/' + roomId, {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
    'API-Key': localStorage.getItem('api_Key')}
  }).then((response) => {
    if (response.status != 200) { throw new Error("bad request"); }
    return response.json();
  }).then((json) => {
    document.querySelector('.room').querySelector('.displayRoomName').querySelector('strong').innerText = json.roomName;
  }).catch((error) => {
    console.error(error);
  });
}


function change_Roomname() {
  let roomId = window.location.pathname.split('/').pop();
  let newRoomname = document.querySelector('.room').querySelector('.editRoomName').querySelector('input').value.trim();
  if (newRoomname != ''){
    fetch('/api/changeRoomname/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 
      'API-Key': localStorage.getItem('api_Key')},
      body: JSON.stringify({room_id: roomId, new_roomname: newRoomname})
    }).then((response) => {
      if (response.status === 200) {
        location.reload();
      }
    }).catch((error) => {
      console.error(error);
    });
  }
}

function postMessage() {
  let roomId = window.location.pathname.split('/').pop();
  let newMessage = document.querySelector('.room').querySelector('.comment_box').querySelector("textarea").value.trim();
  if (newMessage != ''){
    fetch('/api/postMessage/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 
      'API-Key': localStorage.getItem('api_Key')},
      body: JSON.stringify({user_id: localStorage.getItem('userid'), room_id: roomId, new_message: newMessage})
    }).then((response) => {
      if (response.status === 200) {
        document.querySelector('.room').querySelector('.comment_box').querySelector("textarea").value = '';
      }
    }).catch((error) => {
      console.error(error);
    });
  }
}

// When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process. 



function startMessagePolling() {
  console.log('start message polling');
  let oldMessagesId = [];
  let roomId = window.location.pathname.split('/').pop();
  let messageList = document.querySelector('.room').querySelector('.chat').querySelector('.messages');
  messageList.innerHTML = '';
  setInterval(() => {
    fetch('/api/getMessage/' + roomId, {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
      'API-Key': localStorage.getItem('api_Key')}
    })
    .then((response) => {
      if (response.status != 200) { throw new Error("bad request"); }
      return response.json();
    }).then((json) => {
      if (json.length != 0) {
        json.forEach(message => {
          if (!oldMessagesId.includes(message.id)){
            oldMessagesId.push(message.id);
            console.log(oldMessagesId);
            let messageElement = document.createElement('message');
            let messageAuthor = document.createElement('author');
            let messageContent = document.createElement('content');
            messageAuthor.innerText = message.name;
            messageContent.innerText = message.body;
            messageElement.appendChild(messageAuthor);
            messageElement.appendChild(messageContent);
            messageList.appendChild(messageElement);
          } 
        })
      } 
    })
  }, 100);
}

if (isLoggedIn && (path === "/room" || path === "/room/")){
  document.querySelector('.room').querySelector('.roomDetail').style.display = "none";
  document.querySelector('.room').querySelector('.clip').style.display = "none";
} else if (isLoggedIn && path.startsWith("/rooms")) {
  getRoomInfo();
  startMessagePolling();
}


