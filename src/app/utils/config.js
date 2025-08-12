// src/app/utils/config.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_TIMEOUT = process.env.NEXT_PUBLIC_API_TIMEOUT || 10000;

export { API_BASE_URL, API_TIMEOUT }; 