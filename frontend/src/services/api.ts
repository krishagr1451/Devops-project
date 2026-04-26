import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
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