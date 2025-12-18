import * as amqp from 'amqplib';

export const RABBITMQ_CONNECTION = 'RABBITMQ_CONNECTION';

export const rabbitMqProvider = {
  provide: RABBITMQ_CONNECTION,
  useFactory: async () => {
    const conn = await amqp.connect('amqp://localhost');
    return conn;
  },
};