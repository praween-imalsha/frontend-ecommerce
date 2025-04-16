$(document).ready(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("id");

    if (!token) {
        return showSessionExpired();
    }

    $("#logout-option").click(handleLogout);
    loadProductsView();
    loadProductsDropdown();
    loadApprovedReviews();
    updateCartCount();



        $("#profile-btn").click(function (event) {
            event.preventDefault();
            $("#profile-menu").toggleClass("show");
        });


        $(document).click(function (e) {
            if (!$(e.target).closest("#profile-btn, #profile-menu").length) {
                $("#profile-menu").removeClass("show");
            }
        });

    function formatLKR(amount) {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function handleLogout() {
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
                window.location.href = "login.html";
            }
        });
    }

    function showSessionExpired() {
        Swal.fire({
            title: "Session Expired!",
            text: "Please log in again.",
            icon: "warning",
            confirmButtonColor: "#d33",
            confirmButtonText: "OK"
        }).then(() => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    }

    function showError(message) {
        Swal.fire({ title: "Error!", text: message, icon: "error", confirmButtonColor: "#d33" });
    }

    function showWarning(title, text) {
        Swal.fire({ title, text, icon: "warning", confirmButtonColor: "#3085d6" });
    }


    function loadProductsView(keyword = "", categoryId = "", sortBy = "default") {
        let url = "http://localhost:8080/api/v1/products";

        if (categoryId && keyword) {
            url += `/category/${categoryId}?search=${encodeURIComponent(keyword)}`;
        } else if (categoryId) {
            url += `/category/${categoryId}`;
        } else if (keyword) {
            url += `?search=${encodeURIComponent(keyword)}`;
        }

        $.ajax({
            url,
            type: "GET",
            headers: { Authorization: `Bearer ${token}` },
            success: (data) => {
                if (sortBy === "price-low") data.sort((a, b) => a.price - b.price);
                else if (sortBy === "price-high") data.sort((a, b) => b.price - a.price);
                else if (sortBy === "title") data.sort((a, b) => a.title.localeCompare(b.title));

                renderProducts(data);
            },
            error: () => showError("Failed to load products.")
        });
    }

    function renderProducts(products) {
        const container = $("#products-list");
        container.empty();

        if (!products.length) {
            container.html("<p class='text-center'>No products available.</p>");
            return;
        }

        products.forEach(product => {
            container.append(`
                <div class="col-md-4 mb-4">
                    <div class="card shadow-sm">
                        <img src="http://localhost:8080/api/v1/products/${product.id}/image" class="card-img-top" alt="${product.title}">
                        <div class="card-body">
                            <h5 class="card-title">${product.title}</h5>
                            <p class="text-muted">${product.categoryName || "Unknown"}</p>
                            <p class="card-text"><strong>${formatLKR(product.price)}</strong></p>
                            <button class="btn btn-success add-to-cart" data-id="${product.id}" data-title="${product.title}" data-price="${product.price}">
                                🛒 Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `);
        });
    }


    $(document).on("click", ".add-to-cart", function () {
        const productId = $(this).data("id");
        const title = $(this).data("title");

        $.ajax({
            url: "http://localhost:8080/api/v1/cart/add",
            type: "POST",
            headers: { Authorization: `Bearer ${token}` },
            data: {
                userId: userId,
                productId: productId,
                quantity: 1
            },
            success: () => {
                Swal.fire({
                    title: "Added to Cart!",
                    text: `"${title}" has been added to your cart.`,
                    icon: "success",
                    confirmButtonColor: "#28a745",
                    timer: 2000
                });
                updateCartCount();
            },
            error: (error) => {
                console.error("Error adding to cart:", error);
                showError("Failed to add to cart. Please try again.");
            }
        });
    });


    function updateCartCount() {
        $.ajax({
            url: `http://localhost:8080/api/v1/cart/${userId}`,
            type: "GET",
            headers: { Authorization: `Bearer ${token}` },
            success: (cartData) => {
                const cartCount = cartData ? cartData.length : 0;
                $("#cart-count").text(cartCount);
            },
            error: (error) => {
                console.error("Error fetching cart:", error);
            }
        });
    }


    $("#search-form").submit(function (event) {
        event.preventDefault();
        const keyword = $("#search-bar").val();
        const categoryId = $("#category-dropdown").val();
        const sortBy = $("#sort-dropdown").val();
        loadProductsView(keyword, categoryId, sortBy);
    });

    $("#category-dropdown, #sort-dropdown").change(function () {
        const keyword = $("#search-bar").val();
        const categoryId = $("#category-dropdown").val();
        const sortBy = $("#sort-dropdown").val();
        loadProductsView(keyword, categoryId, sortBy);
    });


    function loadProductsDropdown() {
        $.ajax({
            url: "http://localhost:8080/api/v1/products",
            type: "GET",
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                const select = $("#product-select");
                select.empty().append('<option value="">📦 Select a Product</option>');
                data.forEach(product => {
                    select.append(`<option value="${product.id}">${product.title}</option>`);
                });
            },
            error: () => showError("Failed to load product list.")
        });
    }

    let selectedRating = 0;
    $(".star").click(function () {
        selectedRating = $(this).data("value");
        $(".star").css("color", "gray");
        $(this).prevAll().addBack().css("color", "gold");
    });

    $("#review-form").submit(function (event) {
        event.preventDefault();
        const productId = $("#product-select").val();
        const comment = $("#reviewText").val();

        if (!productId) return showWarning("Select a Product", "Choose a product before reviewing.");
        if (selectedRating === 0) return showWarning("Select a Rating", "Please select a star rating.");

        const reviewData = {
            product: { id: productId },
            rating: selectedRating,
            comment: comment,
            user: { id: userId }
        };

        $.ajax({
            url: "http://localhost:8080/api/v1/reviews/submit",
            type: "POST",
            headers: { Authorization: `Bearer ${token}` },
            contentType: "application/json",
            data: JSON.stringify(reviewData),
            success: () => {
                Swal.fire({
                    title: "Review Submitted!",
                    text: "Thanks for your feedback.",
                    icon: "success",
                    confirmButtonColor: "#28a745",
                    timer: 2000
                });
                $("#reviewText").val("");
                selectedRating = 0;
                $(".star").css("color", "gray");
                loadApprovedReviews();
            },
            error: () => showError("Failed to submit review.")
        });
    });

    function loadApprovedReviews() {
        $.ajax({
            url: "http://localhost:8080/api/v1/reviews/approved",
            type: "GET",
            headers: { Authorization: `Bearer ${token}` },
            success: function (reviews) {
                const reviewList = $("#reviews-list");
                reviewList.empty();

                if (!reviews.length) {
                    reviewList.html("<p class='text-muted'>No reviews yet. Be the first to review!</p>");
                    return;
                }

                reviews.forEach(review => {
                    reviewList.append(`
                        <div class="review-card">
                            <div class="card-body">
                                <h5 class="card-title">⭐ ${review.rating}/5</h5>
                                <p class="card-text" style="color: #0f5132; font-weight: bolder">Product: ${review.productTitle}</p>
                                <p class="card-text">${review.comment}</p>
                                <small class="text-muted">By ${review.userName || "Anonymous"} on ${new Date(review.date).toLocaleDateString()}</small>
                            </div>
                        </div>
                    `);
                });
            },
            error: () => showError("Failed to load reviews.")
        });
    }
});
