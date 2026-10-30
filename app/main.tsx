import React from 'react';
import {createRoot} from 'react-dom/client';
import Notebook from './components/Notebook';
import './globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><Notebook/></React.StrictMode>);
