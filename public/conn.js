const mongoose= require('mongoose');

async function connectDB(){
    try {
       await mongoose.connect('mongodb+srv://TanajiJadhav2625:sumit%402625@cluster0.esltb.mongodb.net/hotelmanagement');
        console.log('Connected')
    } catch (error) {
        console.log('error',error)
    }
    
}

module.exports= connectDB
