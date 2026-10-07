import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL?.trim();

if (!API_URL) {
  throw new Error("VITE_API_URL is required. Set it in frontend/.env before starting or building the app.");
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "The booking service took too long to respond."
        : error.response
          ? "The request could not be completed."
          : "Unable to reach the booking service. Please try again.");
    return Promise.reject(Object.assign(new Error(message), {
      status: error.response?.status,
      code: error.code
    }));
  }
);

export const api = {
  register: async (details) => (await apiClient.post("/auth/register", details)).data,
  login: async (credentials) => (await apiClient.post("/auth/login", credentials)).data,
  getCurrentUser: async () => (await apiClient.get("/auth/me")).data,
  logout: async () => apiClient.post("/auth/logout"),
  getMovies: async () => (await apiClient.get("/movies")).data,
  getMovie: async (id) => (await apiClient.get(`/movies/${id}`)).data,
  createMovie: async (movie) => (await apiClient.post("/movies", movie)).data,
  updateMovie: async (id, movie) => (await apiClient.put(`/movies/${id}`, movie)).data,
  deleteMovie: async (id) => apiClient.delete(`/movies/${id}`),
  getShows: async (filters = {}) => (await apiClient.get("/shows", { params: filters })).data,
  getAllShows: async () => (await apiClient.get("/shows/admin/all")).data,
  getShow: async (id) => (await apiClient.get(`/shows/${id}`)).data,
  createShow: async (show) => (await apiClient.post("/shows", show)).data,
  updateShow: async (id, show) => (await apiClient.put(`/shows/${id}`, show)).data,
  deleteShow: async (id) => apiClient.delete(`/shows/${id}`),
  getOccupiedSeats: async (showId) =>
    (await apiClient.get(`/bookings/shows/${showId}/seats`)).data,
  createBooking: async (booking) =>
    (await apiClient.post("/bookings", booking)).data,
  getMyBookings: async () => (await apiClient.get("/bookings/my")).data,
  getAllBookings: async () => (await apiClient.get("/bookings")).data
};
