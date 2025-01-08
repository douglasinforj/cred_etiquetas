import  { configureStore } from '@reduxjs/toolkit';
import participantesReducer from './reducers/participantesReducer'


export const store = configureStore({
    reducer: {
        participantes: participantesReducer,
    }
})