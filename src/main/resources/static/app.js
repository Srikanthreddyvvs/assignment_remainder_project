const apiBaseUrl = ''; // empty because same origin + port 9090

// Keep logged-in user credentials in memory
let loggedInUser = null;

// Helper to create Basic Auth header
function createAuthHeader(username, password) {
  return 'Basic ' + btoa(username + ':' + password);
}

// Show messages
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.style.color = isError ? 'red' : 'green';
}

// Register user
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();

  try {
    const res = await fetch(apiBaseUrl + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      showMessage('auth-message', 'Registration successful. You can now login.', false);
      document.getElementById('register-form').reset();
    } else if (res.status === 409) {
      showMessage('auth-message', 'Username already taken.', true);
    } else {
      showMessage('auth-message', 'Registration failed.', true);
    }
  } catch (err) {
    showMessage('auth-message', 'Error: ' + err.message, true);
  }
});

// Login user
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const res = await fetch(apiBaseUrl + '/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      loggedInUser = { username, password };
      showMessage('auth-message', 'Login successful.', false);
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('assignment-section').style.display = 'block';
      loadAssignments();
      document.getElementById('login-form').reset();
      document.getElementById('register-form').reset();
    } else {
      showMessage('auth-message', 'Invalid username or password.', true);
    }
  } catch (err) {
    showMessage('auth-message', 'Error: ' + err.message, true);
  }
});

// Load all assignments
async function loadAssignments() {
  if (!loggedInUser) return;

  try {
    const res = await fetch(apiBaseUrl + '/assignments/all', {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(loggedInUser.username, loggedInUser.password),
      }
    });
    if (res.ok) {
      const assignments = await res.json();
      renderAssignments(assignments);
    } else {
      showMessage('auth-message', 'Failed to load assignments.', true);
    }
  } catch (err) {
    showMessage('auth-message', 'Error: ' + err.message, true);
  }
}

// Render assignments list
function renderAssignments(assignments) {
  const list = document.getElementById('assignment-list');
  list.innerHTML = '';

  if (assignments.length === 0) {
    list.innerHTML = '<li>No assignments found.</li>';
    return;
  }

  assignments.forEach(a => {
    const li = document.createElement('li');
    li.textContent = `${a.title} - Due: ${a.deadline} - ${a.description}`;

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.marginLeft = '10px';
    delBtn.onclick = () => deleteAssignment(a.id);

    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// Add new assignment
document.getElementById('assignment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!loggedInUser) {
    showMessage('auth-message', 'Please login first.', true);
    return;
  }

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const deadline = document.getElementById('deadline').value;
  const studentEmail = document.getElementById('studentEmail').value.trim();

  if (!title || !description || !deadline || !studentEmail) {
    showMessage('auth-message', 'All fields are required.', true);
    return;
  }

  const assignment = { title, description, deadline, studentEmail };

  try {
    const res = await fetch(apiBaseUrl + '/assignments/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createAuthHeader(loggedInUser.username, loggedInUser.password),
      },
      body: JSON.stringify(assignment)
    });

    if (res.ok) {
      showMessage('auth-message', 'Assignment added successfully.', false);
      document.getElementById('assignment-form').reset();
      loadAssignments();
    } else {
      showMessage('auth-message', 'Failed to add assignment.', true);
    }
  } catch (err) {
    showMessage('auth-message', 'Error: ' + err.message, true);
  }
});

// Delete assignment by ID
async function deleteAssignment(id) {
  if (!loggedInUser) {
    showMessage('auth-message', 'Please login first.', true);
    return;
  }

  try {
    const res = await fetch(apiBaseUrl + `/assignments/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': createAuthHeader(loggedInUser.username, loggedInUser.password),
      }
    });

    if (res.ok) {
      showMessage('auth-message', `Assignment deleted.`, false);
      loadAssignments();
    } else {
      showMessage('auth-message', 'Failed to delete assignment.', true);
    }
  } catch (err) {
    showMessage('auth-message', 'Error: ' + err.message, true);
  }
}


// Logout function
document.getElementById('logout-button').addEventListener('click', () => {
  loggedInUser = null;
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('assignment-section').style.display = 'none';
  showMessage('auth-message', 'Logged out.', false);
});
