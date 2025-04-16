const token = localStorage.getItem("token");
const userId = localStorage.getItem("id");
if (!token) {
    Swal.fire({
        title: "Session Expired",
        text: "Please log in again.",
        icon: "warning",
        confirmButtonText: "OK"
    }).then(() => {
        window.location.href = "index.html";
    });
}

function loadPendingReviews() {
    $.ajax({
        url: 'http://localhost:8080/api/v1/reviews/pending',
        type: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function (reviews) {
            const reviewsTableBody = $('#review-table-body');
            reviewsTableBody.empty(); // Clear existing rows

            reviews.forEach(function (review) {
                const row = `
                    <tr>
                        <td>${review.id}</td>
                        <td>${review.productTitle}</td>
                        <td>${review.userName}</td>
                        <td>${review.rating}</td>
                        <td>${review.comment}</td>
                        <td>
                            <button class="btn btn-success" onclick="approveReview(${review.id})">Approve</button>
                            <button class="btn btn-danger" onclick="rejectReview(${review.id})">Reject</button>
                        </td>
                    </tr>
                `;
                reviewsTableBody.append(row);
            });
        },
        error: function (error) {
            console.error('Error fetching reviews:', error);
        }
    });
}

function approveReview(reviewId) {
    $.ajax({
        url: `http://localhost:8080/api/v1/reviews/approve/${reviewId}`,
        method: "PUT",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        success: function () {
            Swal.fire("Approved!", "Review has been approved.", "success");
            loadPendingReviews();
        },
        error: function () {
            Swal.fire("Error!", "Failed to approve review.", "error");
        }
    });
}

function rejectReview(reviewId) {
    $.ajax({
        url: `http://localhost:8080/api/v1/reviews/reject/${reviewId}`,
        method: "DELETE",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        success: function () {
            Swal.fire("Rejected!", "Review has been rejected.", "success");
            loadPendingReviews();
        },
        error: function () {
            Swal.fire("Error!", "Failed to reject review.", "error");
        }
    });
}

// Initial load
loadPendingReviews();