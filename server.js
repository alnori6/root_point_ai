//1. npm insatall / initiation (express , express-validator, mysql2, nodemon, express-session)
//npm start (to start running the server)
// GO to a browser in the same edevice and search
//localhost:7700/html


// Import required modules
const express = require('express');
const { check, validationResult } = require('express-validator');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');


// Create an Express application
const app = express();
app.use(express.json());

app.use(bodyParser.json());

// Use express-session middleware 
app.use(session({
  secret: 'your-secret-key', // Set your own secret key for session encryption
  resave: false,
  saveUninitialized: false
}));


// Middleware to parse form data
app.use(express.urlencoded({ extended: false }));


// Static file serving
app.use('/html', express.static('./html'));
app.use('/css', express.static('./css'));
app.use('/js', express.static('./js'));
app.use('/assests', express.static('./assests'));

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Error handling 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  port: "8889",
  database: "root_point",
});
db.connect((error) => {
  if(error){
    console.log(error)
  }else{
    console.log("MYSQL Connected ...")
  }
})



// Route to handle form submission
app.post('/server', (request, response) => {
  // Validate form input
  const errors = validationResult(request);

  if (!errors.isEmpty()) {
    const errorMsg = "<h1>Your submission is Empty in required fields</h1>" + printErrors(errors.array());
    response.send(errorMsg);


  } else {
    const email = request.body.email;
    const password = request.body.password;

    // Query the database to check email and password
    db.query('SELECT * FROM login WHERE email = ? AND password = ?', [email, password], (err, results) => {

      if (err) {
        console.error('Error executing MySQL query:', err);
        return response.status(500).send('Internal Server Error');
      }

      if (results.length > 0) {
        // Authentication successful
        //const successMsg = "<h1>Logged in succussfully </h1><br><p>Email: </p>" + email + "<p>Details: </p>" + password;
        // response.send(successMsg);
        request.session.managerEmail = email;
        response.redirect('/html/manPage.html'); // Redirect to otherPage.html
        
      } else {
        // Authentication failed
        const errorMsg = "Invalid email or password";

        // Show an alert message without redirecting
        response.send(`
          <script>
            alert("${errorMsg}");
            window.history.back(); // Go back to the previous page
          </script>
        `);
      }
    });
  }
});

// let sqladd="INSERT INTO `customer_rating`(`phone_num`,`company_id`, `branch_id`, `Room_Service:`, `Restaurant`, `Sanitary_Conditions`, `Front_Desk`, `Car_Parking`, `Overall_Branch`) VALUES ('"+phone+"', '"+branch+"','"+rate1+"','"+rate2+"','"+rate3+"','"+rate4+"','"+rate5+"','"+overall+"')";


app.post('/fetch-branches',formValidate, (req, res) => {
  // Extract company ID from request body
  const companyId = req.body.company;

  // Query the database to fetch branches associated with the selected company
  db.query('SELECT branch_id, branch FROM branches WHERE company_id = ?', [companyId], (err, results) => {
      if (err) {
          console.error('Error executing MySQL query:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      
      // Return fetched branches in JSON format
      console.log({branches : results});
      res.json({ branches: results });
  });
});


app.post('/manager', formValidate, (request, response) => {
  // Validate form input
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const errorMsg = "<h1>Your submission is Empty in required fields</h1>" + printErrors(errors.array());
    response.send(errorMsg);
  }else {
    // Extract data from request body
    const { contact, company, branch} = request.body;
    const {rating1, rating2, rating3, rating4, rating5} = request.body;
    const { overallRating } = request.body;
    

    console.log( contact);
    console.log( company);
    console.log(branch);
    console.log('Rating 1:', rating1);
    console.log('Rating 2:', rating2);
    console.log('Rating 3:', rating3);
    console.log('Rating 4:', rating4);
    console.log('Rating 5:', rating5);
    
    // const overallRating = (rating1 + rating2 + rating3 + rating4 + rating5)/5;
    console.log('Overall Rating:', overallRating);

    // Construct SQL query
    const sql = `
        INSERT INTO customer_rating (phone_num, company_id, branch_id,Room_Service, Restaurant, Sanitary_Conditions, Front_Desk, Car_Parking, Overall_Branch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
    `;

    // Execute SQL query
    db.query(sql, [contact, company, branch, rating1, rating2, rating3, rating4, rating5, overallRating], (err, result) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        return response.status(500).send('Error executing MySQL query: ' + err.message); // Send detailed error message
      }
      console.log('Data Inserted');
      response.send('Data Inserted Successfully');
      
    });
  }
    
});



// Define a route to retrieve data and render HTML
app.get('/data1', (req, res) => {
  // Retrieve the logged-in manager's email from the session
  const loggedInManagerEmail = req.session.managerEmail;
  // Query to retrieve data from the database by joining manager and company tables
  const query = `
    SELECT managers.name AS manager_name, companies.company AS company_name
    FROM managers
    INNER JOIN companies ON managers.company_id = companies.company_id
    WHERE managers.email = ?;
  `;
  db.query(query,[loggedInManagerEmail], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error retrieving data from database');
    } else {
      // Send the retrieved data as JSON
      res.json(results);
    }
  });
});


// Define a route to retrieve data for sec2 to sec6
app.get('/data/:sec', (req, res) => {
  // Retrieve the logged-in manager's email from the session
  const loggedInManagerEmail = req.session.managerEmail;
  // Retrieve the sec parameter from the request URL
  const sec = req.params.sec;

  // Calculate the branch ID based on the sec
  const branchId = parseInt(sec.replace('sec', ''));

  // Query to retrieve branch names and overall ratings for sec2 to sec6
  const query = `
        SELECT branches.branch AS branch_name, 
        ROUND(AVG(customer_rating.Room_Service), 1) AS avg_room_service,
        ROUND(AVG(customer_rating.Restaurant), 1) AS avg_restaurant,
        ROUND(AVG(customer_rating.Sanitary_Conditions), 1) AS avg_sanitary_conditions,
        ROUND(AVG(customer_rating.Front_Desk), 1) AS avg_front_desk,
        ROUND(AVG(customer_rating.Car_Parking), 1) AS avg_car_parking,
        ROUND(AVG(customer_rating.Overall_Branch), 1) AS overall_rating
      FROM branches
      INNER JOIN customer_rating ON branches.branch_id = customer_rating.branch_id
      WHERE branches.company_id IN (SELECT company_id FROM managers WHERE email = ?)
      AND branches.branch_id = ?;
  `;

  db.query(query, [loggedInManagerEmail, branchId], (error, results) => {
      if (error) {
          console.log(error);
          res.status(500).send('Error retrieving data from database');
      } else {
          // Send the retrieved data as JSON
          res.json(results);
      }
  });
});


// SELECT branches.branch AS branch_name, ROUND(AVG(customer_rating.Overall_Branch), 1) AS overall_rating
//         FROM branches
//         INNER JOIN customer_rating ON branches.branch_id = customer_rating.branch_id
//         WHERE branches.company_id IN (SELECT company_id FROM managers WHERE email = ?)
//         AND branches.branch_id = ?;


// Logout route
app.post('/logout', (req, res) => {

  console.log('Logout endpoint accessed');
  // Destroy session
  req.session.destroy((err) => {
      if (err) {
          console.error('Error destroying session:', err);
      } else {
          // Redirect to login page after logout
          res.redirect('/html/manager.html');
      }
  });
});





// Function to print error messages
function printErrors(errArray) {
  return errArray.map(err => `<p>- ${err.msg}</p>`).join("");
}


// Middleware to validate form inputs
function formValidate(req, res,next) {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMsg = "<h1>Your submission is Empty in required fields</h1>" + printErrors(errors.array());
        return res.send(errorMsg);
    }
  return [
    
      check('contact')
      .notEmpty().withMessage('You need to provide a phone number')
      .isNumeric().withMessage('Phone number must contain only digits')
      .isLength({ min: 12, max: 12 }).withMessage('Phone number must be 12 digits')
      .trim()
      .escape(),

  check('company')
      .notEmpty().withMessage('You need to choose a company')
      .trim()
      .escape(),

  check('branch')
      .notEmpty().withMessage('You need to choose a branch')
      .trim()
      .escape(),

  check(['rating1', 'rating2', 'rating3', 'rating4', 'rating5'])
      .notEmpty().withMessage('You need to rate all services')
      .isNumeric().withMessage('Ratings must be numeric')
      .trim()
      .escape(),

      next()

  ];
}



const port = process.env.PORT || 7700;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


