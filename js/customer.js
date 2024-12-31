


// Function to fetch branches for the selected company
function fetchBranches(companyId) {
    fetch('/fetch-branches', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ company: companyId }) // Send the selected company ID in the request body
    })
    .then(response => response.json())
    .then(data => {
        // Populate branch dropdown with retrieved branch names
        const branchDropdown = document.getElementById('branch');
        branchDropdown.innerHTML = ''; // Clear existing options
        
        data.branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch.branch_id;
            option.textContent = branch.branch;
            branchDropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching branches:', error);
    });
}

// Event listener for changes in the selected company dropdown
document.getElementById('company').addEventListener('change', function() {
    console.log('Company dropdown changed');
    const selectedCompanyId = this.value; // Get the selected company ID from the dropdown
    if (selectedCompanyId) {
        fetchBranches(selectedCompanyId); // Call fetchBranches function with the selected company ID
    }
});




const ratings = document.querySelectorAll('.rating');
const ratingValues = document.querySelectorAll('.rating-value');

let currentRatings = [0, 0, 0, 0, 0];

// Initialize separate variables to hold each rating
let rating1 = 0; let = rating2 = 0; let rating3 = 0; let = rating4 = 0; let = rating5 = 0;


ratings.forEach((rating, index) => {
  currentRatings[index] = 0;

  const stars = rating.querySelectorAll('.fa-star');

  stars.forEach(star => {
    star.addEventListener('mouseover', function() {
      resetStars(index);
      const hoverValue = this.getAttribute('data-value');
      highlightStars(hoverValue, index);
    });

    star.addEventListener('mouseout', function() {
      resetStars(index);
      highlightStars(currentRatings[index], index);
    });

    star.addEventListener('click', function() {
      currentRatings[index] = this.getAttribute('data-value');
      displayRating(currentRatings[index], index);

      switch (index) {
        case 0:
          rating1 = parseInt(ratingValues[index].textContent);
          break;
        case 1:
          rating2 = parseInt(ratingValues[index].textContent);
          break;
        case 2:
          rating3 = parseInt(ratingValues[index].textContent);
          break;
        case 3:
          rating4 = parseInt(ratingValues[index].textContent);
          break;
        case 4:
          rating5 = parseInt(ratingValues[index].textContent);
          break;
        default:
          break;
      }

      // console.log(`Rating value for index ${index + 1}:`, currentRatings[index]); // Log the clicked rating value
      // Log the ratings just before sending them to the backend
      console.log('Rating 1:', rating1);
      console.log('Rating 2:', rating2);
      console.log('Rating 3:', rating3);
      console.log('Rating 4:', rating4);
      console.log('Rating 5:', rating5);
      // const overallRating = (rating1 + rating2 + rating3 + rating4 + rating5)/5;

      
      // sendRatingToBackend(rating1, rating2, rating3, rating4, rating5, overallRating);
      
    });
  });
});

function resetStars(index) {
  const stars = ratings[index].querySelectorAll('.fa-star');
  stars.forEach(star => {
    star.classList.remove('fas');
    star.classList.add('far');
  });
}

function highlightStars(value, index) {
  const stars = ratings[index].querySelectorAll('.fa-star');
  stars.forEach(star => {
    const starValue = parseInt(star.getAttribute('data-value'));
    if (starValue <= value) {
      star.classList.remove('far');
      star.classList.add('fas');
    }
  });
}

function displayRating(rating, index) {
    ratingValues[index].textContent = `${rating}`;  
}

document.querySelector('form').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent default form submission

  // Collect all form data
  const formData = {
    contact: document.getElementById('mobile').value,
    company: document.getElementById('company').value,
    branch: document.getElementById('branch').value,
    rating1: rating1,
    rating2: rating2,
    rating3: rating3,
    rating4: rating4,
    rating5: rating5,
    overallRating: (rating1 + rating2 + rating3 + rating4 + rating5) / 5
  };

  // Call sendRatingToBackend only if the form data is valid
  if (validateForm()) {
    sendRatingToBackend(formData);
  }

  });

  function sendRatingToBackend(formData) {
    fetch('/manager', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(response => response.text())
      .then(data => {
        console.log(data); // Handle the response
        if (data == 'Data Inserted Successfully') {
          Swal.fire({
            title: 'Success!',
            text: 'Data has been submitted successfully!',
            icon: 'success',
            confirmButtonText: 'Ok'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = '/html/index.html'; // Redirect
            }
          });
          clearAll();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }





//function clear will clear all inputs
function clearAll() {
    document.getElementById("mobile").value ="";
    document.getElementById("company").value ="";    
    document.getElementById("branch").value ="";
    

    // Reset currentRatings array to all zeros
    currentRatings.fill(0);

    // Update the display of ratings
    ratings.forEach((rating, index) => {
        resetStars(index);
        displayRating(currentRatings[index], index);
    });

}


// JavaScript to dynamically apply styles and handle interactions
function validateForm() {

  var regPhone = /^9665\d{8}$/;

  const contact = document.getElementById('mobile').value; // Assuming 'mobile' is the id of the contact input field
  const company = document.getElementById('company').value;
  const branch = document.getElementById('branch').value;

  if(contact == "")
  {
      alert("Number is empty...");
      return false;
  }
  
  if(!/^\d+$/.test(contact))
  {
      alert("Please only enter numeric characters only! (Allowed input:0-9)");
      return false;
  }
  if(contact.length !== 12) {
      alert("Please enter the correct phone number");
      //alert("Length 10 numeric long, Please Try Again");
      return false;
  }
  if (contact.match(regPhone) == false) {
      alert("Please enter a valid phone number starting with 9665");
      return false;
  }


  
  if(!branch){
      alert("Please choose a branch");
      return false;
  }

  
  if(!company){
      alert("Please choose a branch");
      return false;
  }

  if (rating1 === 0 || rating2 === 0 || rating3 === 0 || rating4 === 0 || rating5 === 0) {
    alert("Please ensure all ratings are provided before submitting.");
    return false;
  }


  return true;
  
}


function start() {

  var submitButton = document.getElementById("submitButton");
  submitButton.addEventListener("click", validateForm);
  

  var clearButton = document.getElementById("clearButton");
  clearButton.addEventListener("click", clearAll, false);
}
window.addEventListener("load", start, false);

