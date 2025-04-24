import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';  // Verify the correct path to your store configuration

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';  // Keep App.jsx if that's your filename

import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container);  // Create a root.

root.render(
  <StrictMode>
    <Provider store={store}>
      <App /> 
    </Provider>
  </StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
