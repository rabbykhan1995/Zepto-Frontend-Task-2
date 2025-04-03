let currentPageUrl = "https://gutendex.com/books"; // Default API URL

const pagination = (next, previous, totalPage, currentPage) => {
  let paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = ""; // Clear previous pagination

  // Previous button
  if (previous) {
    let prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.addEventListener("click", () => {
      apireq(previous);
    });
    paginationContainer.appendChild(prevBtn);
  }

  // Determine start and end page range dynamically
  let startPage = Math.max(1, currentPage - 2); // Shift back when moving previous
  let endPage = Math.min(currentPage + 2, totalPage); // Show next pages

  // Ensure last page is always accessible if it's not in range
  let showLastPage = totalPage > 5 && endPage < totalPage;

  // Show pages dynamically
  for (let i = startPage; i <= endPage; i++) {
    let pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.style.fontWeight = i === currentPage ? "bold" : "normal"; // Highlight current page
    pageBtn.addEventListener("click", () => {
      apireq(`https://gutendex.com/books?page=${i}`);
    });
    paginationContainer.appendChild(pageBtn);
  }

  // Show last page button only if not already included
  if (showLastPage) {
    let dots = document.createElement("span");
    dots.textContent = " ... ";
    paginationContainer.appendChild(dots);

    let lastPageBtn = document.createElement("button");
    lastPageBtn.textContent = totalPage;
    lastPageBtn.addEventListener("click", () => {
      apireq(`https://gutendex.com/books?page=${totalPage}`);
    });
    paginationContainer.appendChild(lastPageBtn);
  }

  // Next button
  if (next) {
    let nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.addEventListener("click", () => {
      apireq(next);
    });
    paginationContainer.appendChild(nextBtn);
  }
};

// Function to fetch book data
let apireq = async (pageUrl = currentPageUrl) => {
  showLoadingMessage(); // Show loading message before fetching data

  try {
    let response = await fetch(pageUrl);
    let data = await response.json();

    let contentField = document.getElementById("content_show_here");
    contentField.innerHTML = ""; // Clear previous content

    // Load wishlist from localStorage
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    data.results.forEach((element) => {
      let singleBook = document.createElement("div");
      singleBook.classList.add("single_book_main");

      let title = document.createElement("h3");
      let authors = document.createElement("h5");
      let thumb = document.createElement("img");
      let wishlistBtn = document.createElement("button");

      title.textContent = element.title;
      authors.textContent =
        element.authors.length > 0 ? element.authors[0].name : "Unknown Author";

      thumb.src = element.formats["image/jpeg"];
      thumb.alt = element.id;

      // Wishlist button logic
      wishlistBtn.textContent = wishlist.includes(element.id.toString())
        ? "Remove from Wishlist"
        : "Add to Wishlist";

      wishlistBtn.addEventListener("click", () => {
        let updatedWishlist =
          JSON.parse(localStorage.getItem("wishlist")) || [];

        if (updatedWishlist.includes(element.id.toString())) {
          // Remove from wishlist
          updatedWishlist = updatedWishlist.filter(
            (id) => id !== element.id.toString()
          );
          wishlistBtn.textContent = "Add to Wishlist";
        } else {
          // Add to wishlist
          updatedWishlist.push(element.id.toString());
          wishlistBtn.textContent = "Remove from Wishlist";
        }

        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      });

      singleBook.appendChild(thumb);
      singleBook.appendChild(title);
      singleBook.appendChild(authors);
      singleBook.appendChild(wishlistBtn);
      contentField.appendChild(singleBook);
    });

    // Update currentPageUrl with the last requested URL
    currentPageUrl = pageUrl;
    let totalPage = Math.ceil(data.count / 32);

    let urlParams = new URL(pageUrl);
    let currentPage = urlParams.searchParams.get("page")
      ? parseInt(urlParams.searchParams.get("page"))
      : 1;

    // Update pagination with next and previous URLs
    pagination(data.next, data.previous, totalPage, currentPage);
  } catch (error) {
    console.error("Error fetching books:", error);
  }
};

// Function to fetch and display wishlist books
let showWishlist = async () => {
  let contentField = document.getElementById("content_show_here");
  let paginationContainer = document.getElementById("pagination");

  contentField.innerHTML = "<h2>Loading Wishlist...</h2>";
  paginationContainer.innerHTML = ""; // Remove pagination on wishlist page

  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  if (wishlist.length === 0) {
    contentField.innerHTML = "<h2>Your Wishlist is empty.</h2>";
    return;
  }

  let books = [];

  // Fetch books by ID from the API
  for (let id of wishlist) {
    try {
      let response = await fetch(`https://gutendex.com/books?ids=${id}`);
      let data = await response.json();
      if (data.results.length > 0) {
        books.push(data.results[0]); // Store book data
      }
    } catch (error) {
      console.error(`Error fetching book with ID ${id}:`, error);
    }
  }

  contentField.innerHTML = ""; // Clear the loading message

  // Display wishlist books
  books.forEach((book) => {
    let singleBook = document.createElement("div");
    singleBook.classList.add("wishlist_book");

    let title = document.createElement("h3");
    let thumb = document.createElement("img");

    title.textContent = book.title;
    thumb.src = book.formats["image/jpeg"];
    thumb.alt = book.id;

    singleBook.appendChild(thumb);
    singleBook.appendChild(title);
    contentField.appendChild(singleBook);
  });
};

// Show loading message
let showLoadingMessage = () => {
  let contentField = document.getElementById("content_show_here");
  contentField.innerHTML = "<h2>Loading...</h2>";
};

// Initialize page on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  let navbar = document.getElementById("navbar");

  navbar.innerHTML = `<button id="home_btn">Home</button>
      <button id="wishlist_btn">Wish List</button>`;

  apireq(); // Load the first page of books

  const homeBtn = document.getElementById("home_btn");
  const wishlistBtn = document.getElementById("wishlist_btn");

  homeBtn.addEventListener("click", () => {
    apireq("https://gutendex.com/books"); // Reset to first page when Home is clicked
  });

  wishlistBtn.addEventListener("click", () => {
    showWishlist();
  });
});
