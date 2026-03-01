import axios from 'axios';

const API_BASE_URL = 'http://localhost:5288/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const data = error.response?.data;

    if (data?.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors as Record<string, string[]>).flat();
      if (messages.length > 0) {
        return Promise.reject(new Error(messages.join('\n')));
      }
    }

    const message =
      data?.error ??
      data?.title ??
      error.message ??
      'אירעה שגיאה בלתי צפויה';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
