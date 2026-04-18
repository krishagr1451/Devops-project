import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const getMe = () => api.get("/me");
export const login = (email: string, password: string, role: string) =>
  api.post("/login", { email, password, role });
export const register = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone_number: string;
}) => api.post("/register", data);
export const logout = () => api.post("/logout");

// ── Admin – Properties ────────────────────────────────────────────────────────
export const getDashboard = () => api.get("/dashboard");
export const addProperty = (data: Record<string, string>) =>
  api.post("/add_property", data);
export const getProperty = (id: number) => api.get(`/edit_property/${id}`);
export const updateProperty = (id: number, data: Record<string, string>) =>
  api.put(`/edit_property/${id}`, data);
export const deleteProperty = (id: number) =>
  api.delete(`/delete_property/${id}`);

// ── Admin – Amenities ─────────────────────────────────────────────────────────
export const getAmenities = (propertyId: number) =>
  api.get(`/view_amenities/${propertyId}`);
export const addAmenity = (
  propertyId: number,
  amenity_name: string,
  amenity_description: string
) => api.post(`/add_amenities/${propertyId}`, { amenity_name, amenity_description });
export const deleteAmenity = (id: number) =>
  api.delete(`/delete_amenity/${id}`);
export const getAmenity = (id: number) => api.get(`/edit_amenity/${id}`);
export const updateAmenity = (
  id: number,
  amenity_name: string,
  amenity_description: string,
  property_id: number
) => api.put(`/edit_amenity/${id}`, { amenity_name, amenity_description, property_id });

// ── Admin – Rooms ─────────────────────────────────────────────────────────────
export const getRooms = (propertyId: number) =>
  api.get(`/view_rooms/${propertyId}`);
export const addRoom = (
  propertyId: number,
  data: Record<string, string | boolean>
) => api.post(`/add_room/${propertyId}`, data);
export const deleteRoom = (id: number) => api.delete(`/delete_room/${id}`);
export const getRoom = (id: number) => api.get(`/edit_room/${id}`);
export const updateRoom = (id: number, data: Record<string, string | boolean>) =>
  api.put(`/edit_room/${id}`, data);
export const getRoomStatus = (propertyId: number) =>
  api.get(`/room_status/${propertyId}`);

// ── Guest ─────────────────────────────────────────────────────────────────────
export const getUserDashboard = () => api.get("/user_dashboard");
export const getPropertyDetails = (id: number) =>
  api.get(`/view_more/${id}`);
export const bookRoom = (
  roomId: number,
  propertyId: number,
  data: Record<string, string>
) => api.post(`/book_room/${roomId}/${propertyId}`, data);
export const getMyBookings = () => api.get("/my_bookings");
export const cancelBooking = (id: number) =>
  api.post(`/cancel_booking/${id}`);
export const addReview = (
  roomId: number,
  data: { rating: number; comment: string; property_id: number }
) => api.post(`/add_review/${roomId}`, data);
