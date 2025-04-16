document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("id");

    if (!token) {
        return Swal.fire({
            title: "Session Expired!",
            text: "Please log in again.",
            icon: "warning",
            confirmButtonColor: "#d33",
            confirmButtonText: "OK"
        }).then(() => {
            window.location.href = "index.html";
        });
    }

    const cartItemsContainer = document.querySelector("#cart-items");
    const totalPriceElement = document.querySelector("#total-price");

    const formatter = new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR'
    });

    function loadCartItems() {
        fetch(`http://localhost:8080/api/v1/cart/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(cartData => {
                cartItemsContainer.innerHTML = "";
                let total = 0;

                if (!Array.isArray(cartData) || cartData.length === 0) {
                    cartItemsContainer.innerHTML = "<tr><td colspan='5' class='text-center'>🛒 Your cart is empty.</td></tr>";
                    totalPriceElement.textContent = formatter.format(0);
                    return;
                }

                cartData.forEach(item => {
                    if (!item.product) {
                        console.warn("Cart item missing product info:", item);
                        return;
                    }

                    const subtotal = item.product.price * item.quantity;
                    total += subtotal;

                    cartItemsContainer.innerHTML += `
                        <tr>
                            <td>
                                <img src="${item.product.image}" alt="${item.product.title}" style="width: 50px;">
                                ${item.product.title}
                            </td>
                            <td>${formatter.format(item.product.price)}</td>
                            <td>
                                <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="item-quantity form-control">
                            </td>
                            <td>${formatter.format(subtotal)}</td>
                            <td>
                                <button class="btn btn-danger btn-sm btn-remove" data-id="${item.id}">🗑 Remove</button>
                            </td>
                        </tr>
                    `;
                });

                totalPriceElement.textContent = formatter.format(total);
            })
            .catch(error => {
                showError("Failed to load cart items.");
                console.error(error);
            });
    }

    cartItemsContainer.addEventListener("change", (event) => {
        if (event.target.classList.contains("item-quantity")) {
            const cartItemId = event.target.dataset.id;
            const newQuantity = parseInt(event.target.value);

            if (newQuantity < 1) {
                Swal.fire("Invalid Quantity", "Quantity must be at least 1.", "warning");
                loadCartItems();
                return;
            }

            fetch(`http://localhost:8080/api/v1/cart/${cartItemId}/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            })
                .then(() => {
                    Swal.fire("Updated", "Quantity updated successfully.", "success");
                    loadCartItems();
                })
                .catch(error => {
                    showError("Failed to update quantity.");
                    console.error(error);
                });
        }
    });

    cartItemsContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("btn-remove")) {
            const cartItemId = event.target.dataset.id;

            Swal.fire({
                title: "Remove Item?",
                text: "This item will be removed from your cart.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, remove it"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`http://localhost:8080/api/v1/cart/${cartItemId}/remove`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                    })
                        .then(() => {
                            Swal.fire("Removed", "Item removed from cart.", "success");
                            loadCartItems();
                        })
                        .catch(error => {
                            showError("Failed to remove item.");
                            console.error(error);
                        });
                }
            });
        }
    });

    window.clearCart = () => {
        Swal.fire({
            title: "Clear Cart?",
            text: "All items will be removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Clear All"
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`http://localhost:8080/api/v1/cart/clear/${userId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(() => {
                        Swal.fire("Cleared", "Cart has been emptied.", "success");
                        loadCartItems();
                    })
                    .catch(error => {
                        showError("Failed to clear cart.");
                        console.error(error);
                    });
            }
        });
    };

    window.checkout = () => {
        const totalPrice = parseFloat(totalPriceElement.textContent.replace(/[^\d.-]/g, ""));
        if (totalPrice > 0) {
            window.location.href = "checkout.html";
        } else {
            Swal.fire("Cart is Empty", "Please add items before checkout.", "info");
        }
    };

    function showError(message) {
        Swal.fire("Error", message, "error");
    }

    loadCartItems();
});
