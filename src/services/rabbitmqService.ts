// seller-ms/src/services/rabbitmqService.ts
import amqp from 'amqplib';
import Product from '../models/productSchema';
import Discount from '../models/discountModel';

const RABBITMQ_URL = 'amqp://localhost';
const DISCOUNT_QUEUE = 'apply_discount_queue';

export const startDiscountConsumer = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(DISCOUNT_QUEUE, { durable: true });

    console.log('Waiting for messages in %s', DISCOUNT_QUEUE);

    channel.consume(DISCOUNT_QUEUE, async (msg) => {
      if (msg !== null) {
        const { productId, discountCode } = JSON.parse(msg.content.toString());

        try {
          // Fetch discount details from admin-ms or from a local store
          const discount = await Discount.findOne({ code: discountCode });

          if (!discount || !discount.isActive) {
            console.error('Discount not found or inactive');
            return;
          }

          const product = await Product.findById(productId);

          if (!product) {
            console.error('Product not found');
            return;
          }

          const discountedPrice = product.MRP * (1 - discount.percentage / 100);
          product.discountCode = discountCode;
          product.discountedPrice = discountedPrice;

          await product.save();
          console.log('Discount applied successfully:', product);
        } catch (error) {
          console.error('Error applying discount:', error);
        }

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Error setting up RabbitMQ consumer:', error);
  }
};
