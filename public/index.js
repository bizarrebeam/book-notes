document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const dropdownList = document.getElementById('dropdownList');

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    const handleDebouncedInput = async function () {
        const searchTerm = searchInput.value.trim();
        console.log("Search Term: ", searchTerm);

        try {
            const { bookTitle, bookAuthor, coverId } = await fetchData(searchTerm);            
            
            console.log("Searched Book: ", bookTitle);
            console.log("Cover Id: ", coverId);
            console.log("Book Author: ", bookAuthor);
            // Update the dropdown list
            await updateDropdown(bookTitle, coverId, bookAuthor, dropdownList);
        } catch (error) {
            console.error('Error updating dropdown:', error);
        }
    };

    // Attach the debounced input event handler
    searchInput.addEventListener('input', debounce(handleDebouncedInput, 300));

    document.addEventListener('click', function (event) {
        // Close dropdown when clicking outside the search container
        if (!event.target.closest('.dropdown')) {
            dropdownList.style.display = 'none';
        }
    });
    const label = $("label");
    const labelArray = document.querySelectorAll("label");
    //Add checked (orange color) class clicked labels.    
    label.on("click", function(event) {          
        label.removeClass("checked");        
        const labelValue = $(this).attr("for");
        for (let i = 0; i < labelValue; i++) {            
            $(labelArray[i]).addClass("checked");            
        }       
    })

    
});

async function fetchData(searchTerm) {
    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${searchTerm}&limit=5`);
        if (!response.ok) { // common practice
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        const result = data.docs; // docs itu specific dari openlibrary
        const bookTitle = result.map((book) => book.title);
        const bookAuthor = result.map((book) => book.author_name);
        const coverId = result.map((book) => book.cover_id); // in case error, aslinya ini cover_i aja

        return {
            bookTitle,
            bookAuthor,
            coverId
        };  
    } catch (err) {
        console.error("Error fetching data: ", err);
    }
}

async function updateDropdown(items, coverId, bookAuthor, dropdownList) {
    // Clear the dropdown list
    dropdownList.innerHTML = '';

    // Create a new list item for each item in the list
    items.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        listItem.classList.add('dropdown-item');
        listItem.dataset.coverId = coverId[index];
        listItem.dataset.bookAuthor = bookAuthor[index];
        dropdownList.appendChild(listItem);
    });

    // Display the dropdown list
    dropdownList.style.display = 'block';
}
