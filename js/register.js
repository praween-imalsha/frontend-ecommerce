const API_BASE_URL = "http://localhost:8080/api/v1/auth";

$("#register-form").on("submit", function(e) {
    e.preventDefault();

    const firstname = $("#register-firstname").val();
    const lastname = $("#register-lastname").val();
    const email = $("#register-email").val();
    const password = $("#register-password").val();
    const role = $("#register-role").val();
    const registerButton = e.target.querySelector("button");

    registerButton.classList.add("loading");
    registerButton.innerHTML = "🔄 Sending Code...";

    $.ajax({
        url: `${API_BASE_URL}/register`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ firstname, lastname, email, password, role }),
        success: function(result) {
            Swal.fire({
                title: "📩 Enter Verification Code",
                text: "A code was sent to your email. Please enter it to complete registration.",
                input: "text",
                inputLabel: "Verification Code",
                inputPlaceholder: "Enter the code",
                showCancelButton: true,
                confirmButtonText: "Verify",
                inputValidator: (value) => {
                    if (!value) return "You must enter a code!";
                }
            }).then((result) => {
                const code = result.value;

                if (code) {
                    $.ajax({
                        url: `${API_BASE_URL}/verify`,
                        method: "POST",
                        data: { email, code },
                        success: function(response) {
                            if (response.message === "Invalid verification code.") {
                                Swal.fire({
                                    title: "❌ Invalid Code",
                                    text: response.message,
                                    icon: "error",
                                    confirmButtonText: "Try Again"
                                }).then(() => {
                                    window.location.href = "index.html";
                                });
                            } else {
                                Swal.fire({
                                    title: "✅ Email Verified!",
                                    text: "You can now log in.",
                                    icon: "success",
                                    confirmButtonText: "Go to Login"
                                }).then(() => {
                                    window.location.href = "index.html";
                                });
                            }
                        },
                        error: function() {
                            Swal.fire("❌ Invalid Code", "The verification code is incorrect.", "error");
                        }
                    });
                } else {
                    Swal.fire("❌ Verification Failed", "You did not enter a code.", "error");

                    $.ajax({
                        url: `${API_BASE_URL}/unverified`,
                        method: "DELETE",
                        data: { email },
                        success: function(response) {
                            console.log(response);
                        },
                        error: function(error) {
                            console.error(error);
                        }
                    });
                }
            });
        },
        error: function(error) {
            Swal.fire("❌ Registration Failed", error.responseJSON.message || "Could not start registration", "error");
        },
        complete: function() {
            registerButton.classList.remove("loading");
            registerButton.innerHTML = "Register";
        }
    });
});
