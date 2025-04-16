const API_BASE_URL = "http://localhost:8080/api/v1/auth";

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const loginButton = e.target.querySelector("button");

    loginButton.classList.add("loading");
    loginButton.innerHTML = "🔄 Logging in...";

    try {
        const response = await fetch(`${API_BASE_URL}/authenticate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            if (!result || !result.token || !result.userId || !result.role) {
                Swal.fire("⚠️ Error", "Invalid user data received.", "error");
                return;
            }

            localStorage.setItem("token", result.token);
            localStorage.setItem("id", result.userId);
            localStorage.setItem("userRole", result.role);

            const userRole = result.role.toUpperCase();

            Swal.fire({
                title: "🎉 Login Successful!",
                text: `Welcome back, ${userRole}!`,
                icon: "success",
                confirmButtonText: "Proceed"
            }).then(() => {
                if (userRole === "ADMIN") {
                    window.location.href = "AdminDashboard.html";
                } else {
                    window.location.href = "customer.html";
                }
            });

        } else {
            if (result.message?.toLowerCase().includes("verify")) {
                Swal.fire({
                    title: "⚠️ Email Not Verified",
                    text: "Would you like us to resend the verification code?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Resend Code",
                    cancelButtonText: "Cancel"
                }).then(async (choice) => {
                    if (choice.isConfirmed) {
                        try {
                            const resendResponse = await fetch(`${API_BASE_URL}/resend-verification?email=${encodeURIComponent(email)}`, {
                                method: "POST"
                            });
                            if (resendResponse.ok) {
                                Swal.fire("📬 Verification Code Sent", "Check your inbox.", "info");
                            } else {
                                Swal.fire("❌ Failed", "Could not resend verification code.", "error");
                            }
                        } catch (err) {
                            console.error(err);
                            Swal.fire("Error", "Something went wrong. Try again later.", "error");
                        }
                    }
                });
            } else {
                Swal.fire("Error!", result.message || "Invalid email or password", "error");
            }
        }
    } catch (error) {
        console.error("Login Error:", error);
        Swal.fire("Error!", "Something went wrong. Please try again.", "error");
    }

    loginButton.classList.remove("loading");
    loginButton.innerHTML = "Login";
});
