/**
 * Kafka Event Publisher Implementation (Adapter)
 * Implements IEventPublisher using Kafka
 */
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { OnboardingEvent } from '../../domain/entities/User';
import { IEventPublisher } from '../../domain/events/IEventPublisher';

export class KafkaEventPublisher implements IEventPublisher {
  private producer: Producer;
  private readonly topic: string;

  constructor(kafka: Kafka, topic: string = 'user-onboarding') {
    this.producer = kafka.producer();
    this.topic = topic;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishOnboardingEvent(event: OnboardingEvent): Promise<void> {
    const message: ProducerRecord = {
      topic: this.topic,
      messages: [
        {
          key: event.userId,
          value: JSON.stringify(event),
          timestamp: event.timestamp.getTime().toString()
        }
      ]
    };

    await this.producer.send(message);
  }
}
