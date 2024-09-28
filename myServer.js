const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const multer = require('multer');
const mongoose = require('./public/conn'); // conn.js exporting the mongoose connection
const Register = require('./public/models/registerModel'); // Register model file
const Booking = require('./public/models/bookingModel'); // Booking model file
const Admin = require('./public/models/adminModel'); // Admin model file
const bodyParser = require('body-parser');
const connectDB = require('./public/conn');

const app = express();
const port = process.env.PORT || 3000;
connectDB();
const static_path = path.join(__dirname, './public/src');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files (including CSS) from the 'src' directory
app.use(express.static(static_path));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).send('Login required to access this page. <a href="login.html">Login here</a>');
  }
}

// Use session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/HotalTestbook',
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // Session TTL (optional)
  })
}));


// Middleware to check if admin is authenticated
function isAdminAuthenticated(req, res, next) {
  if (req.session.adminId) {
    return next();
  } else {
    res.status(401).send('Admin login required to access this page. <a href="/admin-login">Login here</a>');
  }
}

// Endpoint to handle admin registration
app.post('/admin-register', async (req, res) => {
  try {
    const { fullname, email, number, password, confirmpassword } = req.body;

    // Check if passwords match
    if (password !== confirmpassword) {
      return res.status(400).send('Passwords do not match');
    }

    // Check if the email is already registered
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).send('Email is already registered');
    }

    // Create a new admin
    const newAdmin = new Admin({
      fullname,
      email,
      number,
      password
    });

    await newAdmin.save();
    res.redirect('/admin-login.html'); // Redirect to admin login page after successful registration

  } catch (error) {
    res.status(500).send('Error during admin registration');
  }
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Register.findOne({ email });

    if (existingUser) {
      return res.status(400).send('Email is already registered');
    }

    const register = new Register({ ...req.body });
    await register.save();

    req.session.userId = register._id;
    req.session.userEmail = register.email; // Set user email in session

    res.redirect('/profile.html'); // Redirect to the profile page after successful registration
  } catch (error) {
    res.status(500).send('Error during registration');
    console.log(error)
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Register.findOne({ email, password });

    if (user) {
      req.session.userId = user._id;
      req.session.userEmail = user.email; // Set user email in session
      res.redirect('/profile.html'); // Redirect to profile page after successful login
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    res.status(500).send('Error during login');
  }
});

// Endpoint to handle user logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error during logout');
    }
    res.redirect('/login.html'); // Redirect to login page after logout
  });
});

// Endpoint to fetch user data
app.get('/profile-data', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await Register.findById(userId);
    res.json(user);
  } catch (error) {
    res.status(500).send('Error fetching user data');
  }
});

  

// Endpoint to update user profile
app.post('/profile-update', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const userId = req.session.userId;
    const { firstname, dob, number, address, state, city, pincode } = req.body;
    const profilePicture = req.file ? req.file.buffer : null;

    const updateData = {
      firstname,
      dob,
      number,
      address,
      state,
      city,
      pincode
    };

    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    await Register.findByIdAndUpdate(userId, updateData);
    res.redirect('/profile.html'); // Redirect to profile page after successful update
  } catch (error) {
    res.status(500).send('Error updating profile');
  }
});

// Endpoint to handle admin login
app.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email, password });

    if (admin) {
      req.session.adminId = admin._id;
      res.redirect('/admin-dashboard.html'); // Redirect to admin dashboard after successful login
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    res.status(500).send('Error during admin login');
  }
});

// Endpoint to handle admin logout
app.get('/admin-logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error during logout');
    }
    res.redirect('/admin-login.html'); // Redirect to admin login page after logout
  });
});

// Endpoint to add a new user by admin
app.post('/add-user', isAdminAuthenticated, async (req, res) => {
  try {
    const { firstname, dob, email, number, address, state, city, pincode, password, gender } = req.body;

    const existingUser = await Register.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const newUser = new Register({
      firstname,
      dob,
      email,
      number,
      address,
      state,
      city,
      pincode,
      password,
      gender
    });

    await newUser.save();
    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error); // Log the error to the console for debugging
    res.status(500).json({ message: 'Error adding user', error: error.message }); // Send the error message to the client
  }
});

// Endpoint to fetch all users
app.get('/api/users', isAdminAuthenticated, async (req, res) => {
  try {
    const users = await Register.find({}, '-password'); // Exclude password field from the response
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Endpoint to delete a user by admin
app.delete('/api/users/delete/:userId', isAdminAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    await Register.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Endpoint to submit booking (requires authentication)
app.post('/submit-booking', isAuthenticated, upload.fields([{ name: 'image' }, { name: 'ID' }]), async (req, res) => {
  try {
    const { firstname, dob, email, mobile, address, city, state, pincode, checkin, checkout, time, hotelname } = req.body;
    const booking = new Booking({
      firstname,
      dob,
      email,
      mobile,
      address,
      city,
      state,
      pincode,
      checkin,
      checkout,
      time,
      hotelname,
      image: req.files['image'] ? req.files['image'][0].buffer : undefined,
      imageType: req.files['image'] ? req.files['image'][0].mimetype : undefined,

      id: req.files['image'] ? req.files['image'][0].buffer : undefined,
      idType: req.files['image'] ? req.files['image'][0].mimetype : undefined,

      user: req.session.userId // Ensure userId is correctly set
    });

    await booking.save();
    res.status(201).send('Booking successful <a href="room.html">See BYour Room details</a>');
    
  } catch (error) {
    res.status(400).send(error);
  }
});

// Endpoint to fetch all bookings for the logged-in user
app.get('/api/bookings', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const bookings = await Booking.find({ user: userId });
    console.log("User Bookings:", bookings);

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ error: 'No bookings found for this user' });
    }

    // Constructing an array of bookings with image and id data
const bookingData = bookings.map(booking => {
  let imageSrc = '';
  let idSrc = '';
  if (booking.image && booking.imageType) {
      imageSrc = `data:${booking.imageType};base64,${booking.image.toString('base64')}`;
  }
  if (booking.id && booking.idType) {
      idSrc = `data:${booking.idType};base64,${booking.id.toString('base64')}`;
  }
  return {
      firstname: booking.firstname,
      dob: booking.dob,
      email: booking.email,
      mobile: booking.mobile,
      address: booking.address,
      city: booking.city,
      state: booking.state,
      pincode: booking.pincode,
      checkin: booking.checkin,
      checkout: booking.checkout,
      time: booking.time,
      hotelname: booking.hotelname,
      imageSrc: imageSrc,
      idSrc: idSrc
  };
});

    res.json(bookingData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Endpoint to fetch all bookings (admin only)
app.get('/api/admin/bookings', isAdminAuthenticated, async (req, res) => {
  try {
    const bookings = await Booking.find({});
    
    // Construct an array of bookings with image and id data
    const bookingData = bookings.map(booking => {
      let imageSrc = '';
      let idSrc = '';
      if (booking.image && booking.imageType) {
        imageSrc = `data:${booking.imageType};base64,${booking.image.toString('base64')}`;
      }
      if (booking.ide && booking.idType) {
        idSrc = `data:${booking.idType};base64,${booking.id.toString('base64')}`;
      }
      return {
        firstname: booking.firstname,
        dob: booking.dob,
        email: booking.email,
        mobile: booking.mobile,
        address: booking.address,
        city: booking.city,
        state: booking.state,
        pincode: booking.pincode,
        checkin: booking.checkin,
        checkout: booking.checkout,
        time: booking.time,
        hotelname: booking.hotelname,
        imageSrc: imageSrc,
        idSrc: idSrc
      };
    });
    
    res.json(bookingData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/submit-date",(req,res)=>{
  res.send("Date and room is avaialble")
})



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
