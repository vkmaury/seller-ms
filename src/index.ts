import express, { Application } from 'express';
import mongoose from 'mongoose';
// import sellerRoutes from '../src/routes/sellerRoutes';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import bundleRoutes from './routes/bundleRoutes';
import sellerRoutes from './routes/sellerRoutes';
import categoryRoutes from './routes/categoryRoutes';
import saleRoutes from './routes/saleRoutes';
import salesReportRoutes from './routes/salesReportRoutes';
// import { startDiscountConsumer } from './services/rabbitmqService';
// import discountRoutes from './routes/discountRoutes'; 
// import { consumer } from './config/kafka-consume';

dotenv.config();

const app: Application = express();
const PORT: number = 3000;

// Middleware
app.use(express.json());
app.use('/api/v1', productRoutes);
app.use('/api/v1', bundleRoutes);
app.use('/api/v1', sellerRoutes);
app.use('/api/v1', categoryRoutes);
app.use('/api/v1', saleRoutes);
app.use('/api/v1', salesReportRoutes);

// startDiscountConsumer();

// MongoDB Connection
const mongoURI: string = 'mongodb+srv://microservice-database:microservice-database@microservice-database.wsomfbj.mongodb.net/?retryWrites=true&w=majority&appName=microservice-database';

mongoose.connect(mongoURI).then(() => {
    console.log('MongoDB connected...');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// consumer.on('error', (error) => {
//   console.error('Kafka consumer error:', error);
// });

// Routes
// app.use('/api/v1', sellerRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});








