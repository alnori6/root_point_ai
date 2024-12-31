document.addEventListener('DOMContentLoaded', () => {
  const fetchData = () => {
    // Fetch data for sec1
    fetch('/data1')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Update sec1
        const sec1 = document.querySelector('.sec1');
        data.forEach(entry => {
          const { manager_name, company_name } = entry;
          const h3 = sec1.querySelector('h3');
          const p = sec1.querySelector('p');
          h3.textContent = `Hello ${manager_name}`;
          p.textContent = `Your company is ${company_name}` ;
        });
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });



      const fetchData = (sec) => {
        // Fetch data for sec
        fetch(`/data/${sec}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Update the corresponding section
            const section = document.querySelector(`.${sec}`);
            if (data.length === 0 || data[0].overall_rating === null) {
              // No ratings yet
              data.forEach((entry, index) => {
                const { branch_name, overall_rating } = entry;
                const h3 = section.querySelector('h3');
                const span = section.querySelector('span');
                h3.textContent = `${branch_name}`;
                span.textContent = 'No ratings yet';
            });
            } else {
                // Ratings available
                data.forEach((entry, index) => {
                    const { branch_name, overall_rating } = entry;
                    const h3 = section.querySelector('h3');
                    const span = section.querySelector('span');
                    h3.textContent = `${branch_name}`;
                    span.textContent = `${overall_rating} / 5`;
                });
            }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
      };

      // Fetch data for sec2 to sec6
      for (let i = 2; i <= 6; i++) {
          fetchData(`sec${i}`);
      }
    // Similar fetch operations for sec3, sec4, sec5, and sec6...
  };

  fetchData();
});


document.addEventListener('DOMContentLoaded', () => {

  const fetchDataAndChart = (sec) => {
    fetch(`/data/${sec}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const section = document.querySelector(`.${sec}`);
        const canvas = section.querySelector('canvas');

        if (canvas) {
          canvas.remove(); // Remove existing canvas if any
        }

        const div = section.querySelector('#myChart');
        const chartCanvas = document.createElement('canvas');
        chartCanvas.setAttribute('width', '400');
        chartCanvas.setAttribute('height', '400');
        div.appendChild(chartCanvas);

        const labels = [];
        const overallRatings = [];
        const roomServiceRatings = [];
        const restaurantRatings = [];
        const sanitaryConditionsRatings = [];
        const frontDeskRatings = [];
        const carParkingRatings = [];

        data.forEach(entry => {
          labels.push(entry.branch_name);
          overallRatings.push(entry.overall_rating);
          roomServiceRatings.push(entry.avg_room_service);
          restaurantRatings.push(entry.avg_restaurant);
          sanitaryConditionsRatings.push(entry.avg_sanitary_conditions);
          frontDeskRatings.push(entry.avg_front_desk);
          carParkingRatings.push(entry.avg_car_parking);
        });

        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Overall Rating',
              data: overallRatings,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }, {
              label: 'Room Service',
              data: roomServiceRatings,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }, {
              label: 'Restaurant',
              data: restaurantRatings,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }, {
              label: 'Sanitary Conditions',
              data: sanitaryConditionsRatings,
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }, {
              label: 'Front Desk',
              data: frontDeskRatings,
              backgroundColor: 'rgba(255, 159, 64, 0.5)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1
            }, {
              label: 'Car Parking',
              data: carParkingRatings,
              backgroundColor: 'rgba(255, 205, 86, 0.5)',
              borderColor: 'rgba(255, 205, 86, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 5
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
  };

  // Fetch data for sec2 to sec6
  for (let i = 2; i <= 6; i++) {
    fetchDataAndChart(`sec${i}`);
  }


  const coll = document.querySelectorAll('.fa-solid.fa-chevron-down');
  coll.forEach(function (item) {
    item.addEventListener('click', function () {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (content.style.display === 'block') {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    });
  });



  document.getElementById("logoutButton").addEventListener("click", async function(event) {
    event.preventDefault(); // Prevent default link behavior
    
    try {
      const response = await fetch("/logout", { method: "POST" });
      if (response.ok) {
        // Logout successful, redirect to login page
        window.location.href = "/html/manager.html";
      } else {
        // Handle error if logout failed
        console.error("Logout failed:", response.statusText);
      }
    } catch (error) {
      console.error("An error occurred during logout:", error);
    }
  });

});





