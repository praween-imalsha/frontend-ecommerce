document.addEventListener("DOMContentLoaded", function () {
    const userId = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
        Swal.fire({
            title: "Session expired!",
            text: "Please log in again.",
            icon: "warning",
            confirmButtonText: "OK"
        }).then(() => {
            window.location.href = "index.html";
        });
    }

    // Fetch total price and cart items
    fetchTotalPrice(userId, token);

    function fetchTotalPrice(userId, token) {
        $.ajax({
            url: `http://localhost:8080/api/v1/cart/${userId}/total`,
            type: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            success: (data) => {
                const totalPrice = data.totalPrice || "0.00";
                document.getElementById("total-price").innerText = totalPrice.toFixed(2);
            },
            error: (error) => {
                console.error("Error fetching total:", error);
                Swal.fire("Error!", "Failed to load cart total.", "error");
            }
        });
    }

    // Handle checkout form submission
    document.getElementById("checkout-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const address = document.getElementById("address").value;
        const cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, '');
        const expiryDate = document.getElementById("expiryDate").value;
        const cvv = document.getElementById("cvv").value;

        const orderData = {
            customer: { fullName, email, address },
            paymentDetails: { cardNumber, expiryDate, cvv },
            totalPrice: parseFloat(document.getElementById("total-price").innerText)
        };

        $.ajax({
            url: `http://localhost:8080/api/v1/orders/checkout/${userId}`,
            type: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            contentType: "application/json",
            data: JSON.stringify(orderData),
            success: () => {
                Swal.fire("Success", "Order placed successfully!", "success").then(() => {
                    localStorage.removeItem("cart");
                    window.location.href = "orderhistroy.html";
                });
            },
            error: (error) => {
                console.error("Checkout error:", error);
                Swal.fire("Error!", "Failed to place the order.", "error");
            }
        });
    });
});