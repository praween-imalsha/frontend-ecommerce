document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("id");

    const cartItemsContainer = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");

    const currencyFormatter = new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR'
    });

    function showError(message) {
        Swal.fire({
            title: "Error",
            text: message,
            icon: "error",
            confirmButtonColor: "#d33"
        });
    }

    function loadCart() {
        fetch(`http://localhost:8080/api/v1/cart/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                cartItemsContainer.innerHTML = "";
                let total = 0;

                data.forEach(item => {
                    const product = item.product;
                    const title = product?.title || "No Title";
                    const price = product?.price || 0;
                    const quantity = item.quantity;
                    const subtotal = price * quantity;
                    total += subtotal;

                    cartItemsContainer.innerHTML += `
                        <tr>
                            <td>${title}</td>
                            <td>${currencyFormatter.format(price)}</td>
                            <td>
                                <input type="number" min="1" value="${quantity}" class="form-control quantity-input" data-id="${item.id}">
                            </td>
                            <td>${currencyFormatter.format(subtotal)}</td>
                            <td>
                                <button class="btn btn-danger btn-sm remove-btn" data-id="${item.id}">Remove</button>
                            </td>
                        </tr>`;
                });

                totalPriceElement.textContent = currencyFormatter.format(total);
            })
            .catch(error => {
                console.error(error);
                showError("Failed to load cart.");
            });
    }

    cartItemsContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("quantity-input")) {
            const id = e.target.dataset.id;
            const quantity = e.target.value;

            if (quantity <= 0) {
                showError("Quantity must be at least 1.");
                return;
            }

            fetch(`http://localhost:8080/api/v1/cart/${id}/update?quantity=${quantity}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(() => loadCart())
                .catch(error => {
                    console.error(error);
                    showError("Failed to update quantity.");
                });
        }
    });

    cartItemsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-btn")) {
            const id = e.target.dataset.id;
            fetch(`http://localhost:8080/api/v1/cart/${id}/remove`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(() => loadCart())
                .catch(error => {
                    console.error(error);
                    showError("Failed to remove item.");
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
                        loadCart();
                    })
                    .catch(error => {
                        console.error(error);
                        showError("Failed to clear cart.");
                    });
            }
        });
    };

    window.checkout = () => {
        const totalText = totalPriceElement.textContent.replace(/[^\d.-]/g, "");
        const total = parseFloat(totalText);
        if (total > 0) {
            window.location.href = "checkout.html";
        } else {
            Swal.fire({
                title: "Cart is Empty!",
                text: "Add items to your cart before checking out.",
                icon: "info",
                confirmButtonColor: "#3085d6"
            });
        }
    };

    loadCart();
});
