
const API = "https://leavemanagementnew.onrender.com/api";

let selectedRole = "student";
let token = localStorage.getItem("token");

function showLogin(role) {
    selectedRole = role;

    document.getElementById("loginTitle").innerText =
        role === "staff" ? "Staff Login" : "Student Login";

    document.getElementById("message").innerText = "";
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (!email || !password) {
        message.innerText = "Please enter email and password";
        return;
    }

    try {
        const response = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.innerText = data.message || "Login failed";
            return;
        }

        const user = data.user || data;
        const userToken = data.token;

        if (!userToken) {
            message.innerText = "Login token missing. Check backend response.";
            return;
        }

        if (user.role !== selectedRole) {
            message.innerText = "Please select the correct login type";
            return;
        }

        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(user));
        token = userToken;

        if (user.role === "staff") {
            showStaffDashboard();
        } else {
            showStudentDashboard();
        }

    } catch (error) {
        message.innerText = "Server connection error";
    }
}

function showStaffDashboard() {
    document.querySelector(".container").innerHTML = `
        <h1>Staff Dashboard</h1>
        <button onclick="loadLeaves()">View Leave Applications</button>
        <button onclick="logout()">Logout</button>
        <div id="leaveList"></div>
    `;

    loadLeaves();
}

async function loadLeaves() {
    const list = document.getElementById("leaveList");

    try {
        const response = await fetch(`${API}/leave/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const leaves = await response.json();

        if (!response.ok) {
            list.innerHTML = `<p>${leaves.message || "Unable to load leaves"}</p>`;
            return;
        }

        if (!leaves.length) {
            list.innerHTML = "<p>No leave applications found.</p>";
            return;
        }

        list.innerHTML = leaves.map(leave => `
            <div class="leave-card">
                <h3>${leave.studentName}</h3>
                <p>Email: ${leave.studentEmail}</p>
                <p>Reason: ${leave.reason}</p>
                <p>From: ${leave.fromDate}</p>
                <p>To: ${leave.toDate}</p>
                <p>Status: ${leave.status}</p>
                ${
                    leave.status === "Pending" ? `
                    <button onclick="updateLeave('${leave._id}', 'Approved')">Approve</button>
                    <button onclick="updateLeave('${leave._id}', 'Rejected')">Reject</button>
                    ` : ""
                }
            </div>
        `).join("");

    } catch (error) {
        list.innerHTML = "<p>Server connection error</p>";
    }
}

async function updateLeave(id, status) {
    try {
        const response = await fetch(`${API}/leave/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Update failed");
            return;
        }

        alert(`Leave ${status}`);
        loadLeaves();

    } catch (error) {
        alert("Server connection error");
    }
}

function showStudentDashboard() {
    document.querySelector(".container").innerHTML = `
        <h1>Student Dashboard</h1>
        <h2>Apply Leave</h2>
        <input id="reason" placeholder="Leave reason">
        <label>From Date</label>
        <input type="date" id="fromDate">
        <label>To Date</label>
        <input type="date" id="toDate">
        <button onclick="applyLeave()">Submit Leave</button>
        <button onclick="myLeaves()">My Leaves</button>
        <button onclick="logout()">Logout</button>
        <div id="studentLeaves"></div>
    `;
}

async function applyLeave() {
    const reason = document.getElementById("reason").value;
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    if (!reason || !fromDate || !toDate) {
        alert("Please fill all fields");
        return;
    }

    try {
        const response = await fetch(`${API}/leave/apply`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason, fromDate, toDate })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Leave application failed");
            return;
        }

        alert("Leave applied successfully!");
        myLeaves();

    } catch (error) {
        alert("Server connection error");
    }
}

async function myLeaves() {
    const list = document.getElementById("studentLeaves");

    try {
        const response = await fetch(`${API}/leave/my-leaves`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const leaves = await response.json();

        if (!response.ok) {
            list.innerHTML = `<p>${leaves.message || "Unable to load leaves"}</p>`;
            return;
        }

        list.innerHTML = leaves.length
            ? leaves.map(leave => `
                <div class="leave-card">
                    <p>Reason: ${leave.reason}</p>
                    <p>From: ${leave.fromDate}</p>
                    <p>To: ${leave.toDate}</p>
                    <p>Status: ${leave.status}</p>
                </div>
            `).join("")
            : "<p>No leave applications yet.</p>";

    } catch (error) {
        list.innerHTML = "<p>Server connection error</p>";
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.reload();
}

if (token) {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (user && user.role === "staff") {
        showStaffDashboard();
    } else if (user && user.role === "student") {
        showStudentDashboard();
    }
}
