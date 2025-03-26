const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const multer = require("multer"); // Multer for image uploads

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Database Connection
main().then(() => console.log("Connection with Database Successful"))
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/hotel');
}

// Server Setup
const port = 3000;
app.listen(port, () => {
    console.log(`Listening to Server on port ${port}`);
});

// Middleware Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride('_method'));

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/"); // Store images in 'public/uploads'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// Routes
app.get("/home", async (req, res, next) => {
    try {
        const allMenuItems = await Menu.find({}); 
        res.render("home/front", { allMenuItems }); // Pass menu items to the frontend
    } catch (error) {
        console.error("Error fetching menu items:", error);
        next(error);
    }
});

// Reservation Schema
const reservationSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    date: String,
    time: String,
    people: Number,
    message: String
});

const Reservation = mongoose.model("Reservation", reservationSchema);

// Menu Schema
const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    type: { type: String, enum: ["Special", "Starter", "Salad"], required: true }
});


const Menu = mongoose.model("Menu", menuSchema);

app.post("/home", async (req, res, next) => {
    try {
        const newReservation = new Reservation(req.body);
        await newReservation.save();
        console.log("New Reservation:", newReservation);
        res.render("home/front");
        
        const allMenuItems = await Menu.find();
        res.render("home/front");
    } catch (error) {
        next(error);
    }
});


app.get("/", async (req, res) => {
    try {
      const allMenuItems = await MenuItem.find(); // Fetch menu items from DB
      res.render("home/front", { allMenuItems }); // Ensure correct variable name is passed
    } catch (err) {
      console.log(err);
      res.status(500).send("Error fetching menu items");
    }
  });
  



// Admin Dashboard - View Reservations & Menu Items
app.get("/admin", async (req, res) => {
    try {
        const allReservations = await Reservation.find({});
        const allMenuItems = await Menu.find({});
        res.render("home/admin.ejs", { allReservations, allMenuItems });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching reservations and menu items");
    }
});

// Handle Menu Item Submission with Image Upload
app.post("/admin", upload.single("image"), async (req, res) => {
    try {
        const { name, price, type } = req.body; // Fix: Add 'type' here
        const image = req.file ? req.file.filename : "";

        const newItem = new Menu({ name, price, image, type }); // Now 'type' is defined
        await newItem.save();
        console.log("New Menu Item Added:", newItem);
        res.redirect("/admin");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding menu item");
    }
});

app.delete("/admin/reservation/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Reservation.findByIdAndDelete(id);
        console.log(`Reservation with ID ${id} deleted.`);
        res.redirect("/admin");
    } catch (error) {
        console.error("Error deleting reservation:", error);
        res.status(500).send("Error deleting reservation");
    }
});


app.delete("/admin/menu/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Menu.findByIdAndDelete(id);
        console.log(`Menu item with ID ${id} deleted.`);
        res.redirect("/admin");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting menu item");
    }
});

app.get("/admin/menu/:id/edit", async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await Menu.findById(id);
        if (!menuItem) {
            return res.status(404).send("Menu item not found");
        }
        res.render("home/editMenu.ejs", { menuItem });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching menu item");
    }
});

app.put("/admin/menu/:id", upload.single("image"), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, type } = req.body;
        const updateData = { name, price, type };

        // If a new image is uploaded, update it
        if (req.file) {
            updateData.image = req.file.filename;
        }

        await Menu.findByIdAndUpdate(id, updateData);
        console.log(`Menu item with ID ${id} updated.`);
        res.redirect("/admin");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating menu item");
    }
});



