//login.js

function handleLogin(event) {
    event.preventDefault();
  
    const email = event.target.email.value;
    const password = event.target.password.value;
  
    const loginData = { email, password };
  
    fetch("/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            document.getElementById("message").style.color = "red";
            document.getElementById("message").textContent = err.error || "Request failed";
            throw new Error(err.error || "Request failed");
          });
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem("token", data.token);
        alert(data.message);
        event.target.reset();
        window.location.href = "/index.html";
      })
      .catch(err => {
        console.error(err);
      });
  }
  
  function showForgotPasswordForm() {
    const form = document.getElementById("forgot-password-form");
    form.style.display = "block";
}

// ✅ NEW FUNCTION: Handle forgot password submission
function handleForgotPassword() {
    const email = document.getElementById("forgotEmail").value;

    if (!email) {
        alert("Please enter your email.");
        return;
    }

    axios.post("/password/forgotpassword", { email })
        .then(response => {
            alert("Password reset link sent to your email!");
            document.getElementById("forgot-password-form").style.display = "none";
        })
        .catch(error => {
            alert("Failed to send reset email. Try again later.");
            console.error(error);
        });
}