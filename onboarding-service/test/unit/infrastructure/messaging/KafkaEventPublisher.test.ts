/**
 * KafkaEventPublisher Unit Tests
 * Tests Kafka adapter with mocked Kafka producer
 */
import { KafkaEventPublisher } from '../../../../src/infrastructure/messaging/KafkaEventPublisher';
import { OnboardingEvent } from '../../../../src/domain/entities/User';
import { Kafka, Producer } from 'kafkajs';

describe('KafkaEventPublisher', () => {
  let publisher: KafkaEventPublisher;
  let mockProducer: jest.Mocked<Producer>;
  let mockKafka: jest.Mocked<Kafka>;

  beforeEach(() => {
    // Mock producer
    mockProducer = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn()
    } as any;

    // Mock Kafka
    mockKafka = {
      producer: jest.fn().mockReturnValue(mockProducer)
    } as any;

    // Create publisher
    publisher = new KafkaEventPublisher(mockKafka, 'test-topic');
  });

  describe('connect', () => {
    it('should connect to Kafka', async () => {
      mockProducer.connect.mockResolvedValue();

      await publisher.connect();

      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockProducer.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(publisher.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Kafka', async () => {
      mockProducer.disconnect.mockResolvedValue();

      await publisher.disconnect();

      expect(mockProducer.disconnect).toHaveBeenCalled();
    });
  });

  describe('publishOnboardingEvent', () => {
    const event: OnboardingEvent = {
      userId: '123',
      email: 'test@example.com',
      name: 'Test User',
      status: 'onboarded',
      timestamp: new Date('2025-01-01T00:00:00.000Z')
    };

    it('should publish event to Kafka', async () => {
      mockProducer.send.mockResolvedValue({} as any);

      await publisher.publishOnboardingEvent(event);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        messages: [
          {
            key: event.userId,
            value: JSON.stringify(event),
            timestamp: event.timestamp.getTime().toString()
          }
        ]
      });
    });

    it('should use userId as message key', async () => {
      mockProducer.send.mockResolvedValue({} as any);

      await publisher.publishOnboardingEvent(event);

      const call = mockProducer.send.mock.calls[0][0];
      expect(call.messages[0].key).toBe(event.userId);
    });

    it('should serialize event to JSON', async () => {
      mockProducer.send.mockResolvedValue({} as any);

      await publisher.publishOnboardingEvent(event);

      const call = mockProducer.send.mock.calls[0][0];
      const parsedValue = JSON.parse(call.messages[0].value as string);
      
      expect(parsedValue.userId).toBe(event.userId);
      expect(parsedValue.email).toBe(event.email);
      expect(parsedValue.status).toBe('onboarded');
    });

    it('should include timestamp in message', async () => {
      mockProducer.send.mockResolvedValue({} as any);

      await publisher.publishOnboardingEvent(event);

      const call = mockProducer.send.mock.calls[0][0];
      expect(call.messages[0].timestamp).toBe(event.timestamp.getTime().toString());
    });

    it('should handle publish errors', async () => {
      mockProducer.send.mockRejectedValue(new Error('Publish failed'));

      await expect(publisher.publishOnboardingEvent(event))
        .rejects
        .toThrow('Publish failed');
    });
  });

  describe('default topic', () => {
    it('should use default topic when not specified', async () => {
      const defaultPublisher = new KafkaEventPublisher(mockKafka);
      mockProducer.send.mockResolvedValue({} as any);

      const event: OnboardingEvent = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
        status: 'onboarded',
        timestamp: new Date()
      };

      await defaultPublisher.publishOnboardingEvent(event);

      const call = mockProducer.send.mock.calls[0][0];
      expect(call.topic).toBe('user-onboarding');
    });
  });
});
