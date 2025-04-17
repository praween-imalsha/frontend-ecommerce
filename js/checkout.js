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
            window.location.href = "login.html";
        });
    }


    fetchTotalPrice(userId, token);
    fetchCartItems(userId, token);


    function fetchTotalPrice(userId, token) {
        $.ajax({
            url: `http://localhost:8080/api/v1/cart/total/${userId}`,
            type: "GET",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: (data) => {
                const totalPrice = data.totalPrice || "0.00"; // Use totalPrice returned from backend
                document.getElementById("total-price").innerText = totalPrice;
            },
            error: (error) => {
                console.error("Error fetching cart total:", error);
                Swal.fire("Error!", "Failed to load cart total. Please try again.", "error");
            }
        });
    }


    function fetchCartItems(userId, token) {
        $.ajax({
            url: `http://localhost:8080/api/v1/cart/${userId}`,
            type: "GET",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: (data) => {
                if (data && data.length > 0) {
                    localStorage.setItem("cart", JSON.stringify(data));
                } else {
                    Swal.fire("Empty Cart", "Your cart is empty.", "info");
                }
            },
            error: (error) => {
                console.error("Error fetching cart items:", error);
                Swal.fire("Error!", "Failed to load cart items. Please try again.", "error");
            }
        });
    }


    document.getElementById("cardNumber").addEventListener("input", function () {
        let cardNumber = this.value.replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 '); // Format card number
        document.getElementById("card-number").innerText = cardNumber || "**** **** **** ****";
    });


    document.getElementById("expiryDate").addEventListener("input", function () {
        let expiryDate = this.value.replace(/[^\d]/g, '').slice(0, 4); // Remove non-numeric characters
        if (expiryDate.length > 2) {
            expiryDate = expiryDate.slice(0, 2) + '/' + expiryDate.slice(2, 4);
        }
        this.value = expiryDate; // Set the input value with slash
        document.getElementById("expiry-date").innerText = expiryDate || "MM/YY";
    });

    document.getElementById("cvv").addEventListener("input", function () {
        let cvv = this.value.replace(/\D/g, '').slice(0, 3); // Limit CVV to 3 digits
    });


    document.getElementById("fullName").addEventListener("input", function () {
        const name = this.value.trim();
        document.getElementById("card-name").innerText = name || "John Doe";
    });


    document.getElementById("checkout-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const address = document.getElementById("address").value;
        const cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, '');
        const expiryDate = document.getElementById("expiryDate").value;
        const cvv = document.getElementById("cvv").value;
        const totalPrice = parseFloat(document.getElementById("total-price").innerText);

        const cartItems = JSON.parse(localStorage.getItem("cart")) || [];

        if (cartItems.length === 0) {
            Swal.fire("Empty Cart", "Your cart is empty!", "warning");
            return;
        }

        const orderData = {
            customer: {
                fullName,
                email,
                address
            },
            paymentDetails: {
                cardNumber,
                expiryDate,
                cvv
            },
            items: cartItems.map(item => ({
                bookId: item.book.id,
                quantity: item.quantity,
                totalPrice: item.quantity * item.book.price
            })),
            totalPrice
        };

        $.ajax({
            url: `http://localhost:8080/api/v1/orders/checkout/${userId}`,
            type: "POST",
            contentType: "application/json",
            headers: {
                "Authorization": "Bearer " + token
            },
            data: JSON.stringify(orderData),
            success: (data) => {
                Swal.fire({
                    title: "🎉 Order Placed Successfully!",
                    text: "Your order has been placed successfully.",
                    icon: "success",
                    confirmButtonText: "Go to Order History"
                }).then(() => {
                    localStorage.removeItem("cart");
                    localStorage.removeItem("cartTotal");
                    window.location.href = "orderhistroy.html";
                });
            },
            error: (error) => {
                console.error("Error during checkout:", error);
                Swal.fire("Payment Failed", "There was an issue with your payment. Please try again.", "error");
            }
        });
    });
});
