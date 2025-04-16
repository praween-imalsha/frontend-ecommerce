$(document).ready(function () {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire("Not Logged In", "Please log in first.", "warning").then(() => {
            window.location.href = "index.html";
        });
        return;
    }

    function getStatusBadge(status) {
        switch (status) {
            case "PENDING":
                return `<span class="badge bg-warning text-dark">PENDING</span>`;
            case "SHIPPED":
                return `<span class="badge bg-success">SHIPPED</span>`;
            case "CANCELLED":
                return `<span class="badge bg-danger">CANCELLED</span>`;
            default:
                return `<span class="badge bg-secondary">UNKNOWN</span>`;
        }
    }

    function loadAllOrders() {
        Swal.fire({
            title: "Loading Orders...",
            text: "Please wait.",
            icon: "info",
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        $.ajax({
            url: "http://localhost:8080/api/v1/orders/all",
            type: "GET",
            dataType: "json",
            headers: { Authorization: "Bearer " + token },
            success: function (orders) {
                Swal.close();
                $("#order-table-body").empty();

                if (Array.isArray(orders) && orders.length > 0) {
                    orders.forEach((order) => {
                        const row = `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.customerName || "N/A"}</td>
                                <td>${order.productTitle || "N/A"}</td>
                                <td>${order.quantity}</td>
                                <td>$${order.totalPrice.toFixed(2)}</td>
                                <td>${getStatusBadge(order.status)}</td>
                                <td>
                                    <button class="btn btn-info btn-sm" onclick="viewOrderDetails(${order.id})">
                                        <i class="fa fa-eye"></i> View
                                    </button>
                                    <button class="btn btn-primary btn-sm" onclick="openUpdateStatusModal(${order.id})">
                                        <i class="fa fa-edit"></i> Update
                                    </button>
                                </td>
                            </tr>`;
                        $("#order-table-body").append(row);
                    });
                } else {
                    $("#order-table-body").html("<tr><td colspan='7' class='text-center text-muted'>No orders found.</td></tr>");
                }
            },
            error: function () {
                Swal.fire("Error", "Failed to fetch orders.", "error");
            },
        });
    }

    window.viewOrderDetails = function (orderId) {
        $.ajax({
            url: `http://localhost:8080/api/v1/orders/${orderId}`,
            type: "GET",
            dataType: "json",
            headers: { Authorization: "Bearer " + token },
            success: function (order) {
                $("#order-id-details").text(order.id);
                $("#customer-name").text(order.customerName);
                $("#product-title").text(order.productTitle);
                $("#order-quantity").text(order.quantity);
                $("#total-price").text(`$${order.totalPrice.toFixed(2)}`);
                $("#order-status").text(order.status);

                $("#orderDetailsModal").modal("show");
            },
            error: function () {
                Swal.fire("Error", "Failed to load order details.", "error");
            },
        });
    };

    window.openUpdateStatusModal = function (orderId) {
        $.ajax({
            url: `http://localhost:8080/api/v1/orders/${orderId}/status`,
            type: "GET",
            dataType: "json",
            headers: { Authorization: "Bearer " + token },
            success: function (order) {
                $("#order-id-status").text(order.id);
                $("#new-status").val(order.status);

                $("#updateStatusModal").modal("show");

                $("#updateStatusBtn")
                    .off("click")
                    .on("click", function () {
                        const newStatus = $("#new-status").val();

                        $.ajax({
                            url: `http://localhost:8080/api/v1/orders/${order.id}/status/${newStatus}`,
                            type: "PUT",
                            headers: { Authorization: "Bearer " + token },
                            success: function () {
                                Swal.fire("Updated!", "Order status updated successfully.", "success");
                                $("#updateStatusModal").modal("hide");
                                loadAllOrders();
                            },
                            error: function () {
                                Swal.fire("Error", "Failed to update order status.", "error");
                            },
                        });
                    });
            },
            error: function () {
                Swal.fire("Error", "Unable to fetch status info.", "error");
            },
        });
    };

    loadAllOrders();
});
