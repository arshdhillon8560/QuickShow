//Function to check availability of selected seats for a show

import Booking from "../models/booking.js";
import Show from "../models/Show.js"

const checkSeatsAvailability = async (showId,selectedSeats)=>{
   try{
      const showData = await Show.findById(showId)
      if(!showData){
         return false;
      }
      const occupiedSeats = showData.occupiedSeats;
      const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

      return !isAnySeatTaken;

   } catch (error){
             console.log("Error checking seat availability:", error);
      return false;
   }
}

export const createBooking = async (req, res) => { 
    try {
        const {userId}= req.auth();
        const { showId, selectedSeats } = req.body;
        const {origin} =req.headers;

        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
        if (!isAvailable) {
            return res.status(400).json({ success: false, message: "Selected seats are not available" });
        }

        const showData = await Show.findById(showId).populate("movie");

        const booking =await Booking.create({
            user:userId,
            show:showId,
            amount:showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
        })

        console.log("Booking data:", booking);

        selectedSeats.forEach((seat)=>{
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');
        await showData.save();

        //Payment Gateway Integration


        res.json({
            success: true,
            message: "Booking created successfully"})

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ success: false, message: error.message });
    }

}

export const getOccupiedSeats = async (req, res) => {
    try {
        
        const { showId } = req.params;
        const showData = await Show.findById(showId);
        const occupiedSeats = Object.keys(showData.occupiedSeats);

        res.json({ success: true, occupiedSeats });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}