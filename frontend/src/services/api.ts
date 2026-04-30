import axios from 'axios';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  return `http://${hostname}:8000`;
};

const API = axios.create({
  baseURL: getBaseURL(),
});

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

export const getProducts = () => API.get('/products/');
export const getProduct = (id: number) => API.get(`/products/${id}`);
export const createProduct = (data: Product) => API.post('/products/', data);
export const updateProduct = (id: number, data: Product) => API.put(`/products/${id}`, data);
export const deleteProduct = (id: number) => API.delete(`/products/${id}`);