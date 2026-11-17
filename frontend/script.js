
const API = "http://localhost:5000/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

// SHOW MESSAGE
function showMessage(message) {
    document.getElementById("message").innerText = message;
}

// SHOW LOGIN
function showLogin() {
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("registerSection").classList.add("hidden");
}

// SHOW REGISTER
function showRegister() {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.remove("hidden");
}

// REGISTER
async function register() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    try {
        const response = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        showMessage(data.message);

        if (response.ok) {
            showLogin();
        }

    } catch (error) {
        showMessage("Server connection failed");
    }
}

// LOGIN
async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message);
            return;
        }

        token = data.token;
        currentUser = data.user;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(currentUser));

        showDashboard();

    } catch (error) {
        showMessage("Server connection failed");
    }
}

// SHOW DASHBOARD
function showDashboard() {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");

    if (currentUser.role === "student") {
        document.getElementById("studentDashboard").classList.remove("hidden");
        document.getElementById("staffDashboard").classList.add("hidden");
        loadMyLeaves();

    } else if (currentUser.role === "staff") {
        document.getElementById("staffDashboard").classList.remove("hidden");
        document.getElementById("studentDashboard").classList.add("hidden");
        loadAllLeaves();
    }
}

// APPLY LEAVE
async function applyLeave() {
    const reason = document.getElementById("leaveReason").value.trim();
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;

    if (!reason || !fromDate || !toDate) {
        showMessage("Please fill all leave details");
        return;
    }

    try {
        const response = await fetch(`${API}/leave/apply`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                reason,
                fromDate,
                toDate
            })
        });

        const data = await response.json();

        showMessage(data.message);

        if (response.ok) {
            document.getElementById("leaveReason").value = "";
            document.getElementById("fromDate").value = "";
            document.getElementById("toDate").value = "";

            loadMyLeaves();
        }

    } catch (error) {
        showMessage("Unable to apply leave");
    }
}

// STUDENT VIEW LEAVES
async function loadMyLeaves() {
    try {
        const response = await fetch(`${API}/leave/my-leaves`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const leaves = await response.json();

        if (!response.ok) {
            showMessage(leaves.message || "Unable to load leaves");
            return;
        }

        const container = document.getElementById("myLeaves");

        if (leaves.length === 0) {
            container.innerHTML = "<p>No leave applications yet.</p>";
            return;
        }

        container.innerHTML = leaves.map(leave => `
            <div class="leave-card">
                <p><b>Reason:</b> ${escapeHTML(leave.reason)}</p>
                <p><b>From:</b> ${new Date(leave.fromDate).toLocaleDateString()}</p>
                <p><b>To:</b> ${new Date(leave.toDate).toLocaleDateString()}</p>
                <p><b>Status:</b> ${escapeHTML(leave.status)}</p>
            </div>
        `).join("");

    } catch (error) {
        showMessage("Unable to load leave details");
    }
}

// STAFF VIEW ALL LEAVES
async function loadAllLeaves() {
    try {
        const response = await fetch(`${API}/leave/all`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const leaves = await response.json();

        if (!response.ok) {
            showMessage(leaves.message || "Unable to load requests");
            return;
        }

        const container = document.getElementById("allLeaves");

        if (leaves.length === 0) {
            container.innerHTML = "<p>No student leave requests.</p>";
            return;
        }

        container.innerHTML = leaves.map(leave => `
            <div class="leave-card">
                <p><b>Student:</b> ${escapeHTML(leave.studentName)}</p>
                <p><b>Email:</b> ${escapeHTML(leave.studentEmail)}</p>
                <p><b>Reason:</b> ${escapeHTML(leave.reason)}</p>
                <p><b>From:</b> ${new Date(leave.fromDate).toLocaleDateString()}</p>
                <p><b>To:</b> ${new Date(leave.toDate).toLocaleDateString()}</p>
                <p><b>Status:</b> ${escapeHTML(leave.status)}</p>

                ${leave.status === "Pending" ? `
                    <button class="approve" onclick="updateLeave('${leave._id}', 'Approved')">
                        Approve
                    </button>

                    <button class="reject" onclick="updateLeave('${leave._id}', 'Rejected')">
                        Reject
                    </button>
                ` : ""}
            </div>
        `).join("");

    } catch (error) {
        showMessage("Unable to load student requests");
    }
}

// ESCAPE USER CONTENT
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// UPDATE LEAVE STATUS
async function updateLeave(id, status) {
    try {
        const response = await fetch(`${API}/leave/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        showMessage(data.message);

        if (response.ok) {
            loadAllLeaves();
        }

    } catch (error) {
        showMessage("Unable to update leave");
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    token = null;
    currentUser = null;

    document.getElementById("studentDashboard").classList.add("hidden");
    document.getElementById("staffDashboard").classList.add("hidden");

    showLogin();
    showMessage("Logged out successfully");
}

// RESTORE LOGIN AFTER REFRESH
if (token && currentUser) {
    showDashboard();
}
