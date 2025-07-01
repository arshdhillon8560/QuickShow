import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import TicketPrint from "../components/TicketPrint";
import logo from "../assets/logo.svg";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, image_base_url } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/user/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setBookings(data.bookings);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async (bookingId) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert("Failed to load Razorpay");

    const { data } = await axios.post(
      "/api/payment/create-order",
      { bookingId },
      { headers: { Authorization: `Bearer ${await getToken()}` } }
    );

    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      name: "QuickShow",
      description: "Movie Ticket Booking",
      order_id: data.orderId,
      handler: async (response) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

        await axios.post(
          "/api/payment/mark-paid",
          {
            bookingId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          },
          { headers: { Authorization: `Bearer ${await getToken()}` } }
        );
        alert("Payment Successful");
        getMyBookings();
      },
      prefill: {
        name: user?.fullName,
        email: user?.emailAddresses?.[0]?.emailAddress,
      },
      theme: {
        color: "#F37254",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    if (user) getMyBookings();
  }, [user]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />
      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings.map((item, index) => (
        <div
          key={index}
          className="flex flex-col md:flex-row justify-between bg-primary/5 border border-primary/30 rounded-lg mt-4 p-2 max-w-3xl"
        >
          <div className="flex flex-col md:flex-row">
            <img
              src={image_base_url + item.show.movie.poster_path}
              alt=""
              className="md:max-w-45 aspect-video object-cover rounded"
            />
            <div className="flex flex-col p-4">
              <p className="text-lg font-semibold">{item.show.movie.title}</p>
              <p className="text-gray-400 text-sm">{timeFormat(item.show.movie.runtime)}</p>
              <p className="text-gray-400 text-sm mt-auto">{dateFormat(item.show.showDateTime)}</p>
            </div>
          </div>

          <div className="flex flex-col md:items-end md:text-right justify-between p-4">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-semibold mb-3">{currency}{item.amount}</p>

              {!item.isPaid ? (
                <button
                  onClick={() => handlePayment(item._id)}
                  className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer"
                >
                  Pay Now
                </button>
              ) : (
                <button
                  onClick={() => TicketPrint(item)}
                  className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer flex items-center gap-1"
                >
                  <Printer size={16} />
                  Print Ticket
                </button>
              )}
            </div>
            <div className="text-sm">
              <p><span className="text-gray-400">Total Tickets:</span> {item.bookedSeats.length}</p>
              <p><span className="text-gray-400">Seat Number:</span> {item.bookedSeats.join(", ")}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
