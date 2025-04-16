$(document).ready(function () {
    const userId = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
        Swal.fire({
            icon: 'error',
            title: 'Unauthorized',
            text: 'User not logged in! Redirecting to login...',
            confirmButtonColor: '#3085d6'
        }).then(() => {
            window.location.href = "index.html";
        });
        return;
    }

    $("#profile-btn").click(function (event) {
        event.preventDefault();
        $("#profile-menu").toggleClass("show");
    });

    // Close dropdown when clicking outside
    $(document).click(function (e) {
        if (!$(e.target).closest("#profile-btn, #profile-menu").length) {
            $("#profile-menu").removeClass("show");
        }
    });

    // Logout functionality
    $("#logout-option").click(function () {
        Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Logout"
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                Swal.fire({
                    icon: 'success',
                    title: 'Logged out!',
                    text: 'You have been successfully logged out.',
                    confirmButtonColor: '#3085d6'
                }).then(() => {
                    window.location.href = "login.html";
                });
            }
        });
    });

    console.log(`Fetching orders for user ID: ${userId}`);
    loadOrders(userId, token);

    function loadOrders(userId, token) {
        $.ajax({
            url: `http://localhost:8080/api/v1/orders/history/${userId}`,
            type: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function (orders) {
                console.log("Orders received:", orders);
                const tableBody = $("#order-history-table");
                tableBody.empty();

                if (!orders || orders.length === 0) {
                    tableBody.html(`<tr><td colspan="7" class="text-center">No orders found</td></tr>`);
                    return;
                }

                orders.forEach(order => {
                    order.orderItems.forEach((item, index) => {
                        const row = $("<tr></tr>");

                        if (index === 0) {
                            row.append(`<td rowspan="${order.orderItems.length}">${order.id}</td>`);
                            row.append(`<td rowspan="${order.orderItems.length}">${new Date(order.orderDate).toLocaleDateString()}</td>`);
                        }

                        row.append(`<td>${item.product.title}</td>`);
                        row.append(`<td>${item.quantity}</td>`);
                        row.append(`<td>$${item.totalPrice.toFixed(2)}</td>`);

                        if (index === 0) {
                            row.append(`<td rowspan="${order.orderItems.length}"><span class="badge ${getStatusClass(order.status)}">${order.status}</span></td>`);

                            const actionTd = $("<td></td>").attr("rowspan", order.orderItems.length).addClass("text-center");

                            if (order.status === "PENDING" || order.status === "CANCELLED") {
                                const deleteBtn = $("<button></button>")
                                    .addClass("btn btn-danger btn-sm delete-btn")
                                    .attr("data-id", order.id)
                                    .html("🗑 Delete")
                                    .on("click", function () {
                                        confirmDeleteOrder(order.id, token);
                                    });

                                actionTd.append(deleteBtn);
                            } else {
                                actionTd.html("Already Processed");
                            }

                            row.append(actionTd);
                        }

                        tableBody.append(row);
                    });
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching order history:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops!',
                    text: 'Failed to load order history. Please try again.',
                    confirmButtonColor: '#3085d6'
                });
            }
        });
    }

    function confirmDeleteOrder(orderId, token) {
        Swal.fire({
            title: 'Delete Order?',
            text: 'Are you sure you want to delete this order?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteOrder(orderId, token);
            }
        });
    }

    function deleteOrder(orderId, token) {
        $.ajax({
            url: `http://localhost:8080/api/v1/orders/${orderId}`,
            type: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function () {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Order deleted successfully.',
                    confirmButtonColor: '#3085d6'
                });
                loadOrders(userId, token);
            },
            error: function (xhr, status, error) {
                console.error("Error deleting order:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to delete order. Please try again.',
                    confirmButtonColor: '#3085d6'
                });
            }
        });
    }

    function getStatusClass(status) {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'badge bg-warning text-dark';
            case 'SHIPPED': return 'badge bg-info text-white';
            case 'DELIVERED': return 'badge bg-success text-white';
            case 'CANCELLED': return 'badge bg-danger text-white';
            default: return 'badge bg-secondary text-white';
        }
    }

    function updateCartCount() {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        $("#cart-count").text(cart.reduce((total, item) => total + item.quantity, 0));
    }

    updateCartCount();
});
