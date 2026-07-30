const { Kafka, Partitioners } = require('kafkajs');
const EventEmitter = require('events');

class KafkaClient {
  constructor(options) {
    this.kafka = new Kafka({
      clientId: 'egov-pdf',
      brokers: (options.kafkaHost || 'localhost:9092').split(',')
    });
  }
}

class Producer extends EventEmitter {
  constructor(client, options) {
    super();
    this.producer = client.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner
    });
    this.init();
  }
  
  async init() {
    try {
      await this.producer.connect();
      this.emit('ready');
    } catch(err) {
      this.emit('error', err);
    }
  }

  send(payloads, callback) {
    Promise.all(payloads.map(async p => {
      let messages = Array.isArray(p.messages) ? p.messages : [p.messages];
      messages = messages.map(m => typeof m === 'string' ? { value: m } : { value: JSON.stringify(m) });
      return this.producer.send({
        topic: p.topic,
        messages: messages
      });
    })).then(results => {
      if (callback) callback(null, results);
    }).catch(err => {
      if (callback) callback(err);
    });
  }
}

class ConsumerGroup extends EventEmitter {
  constructor(options, topics) {
    super();
    const kafka = new Kafka({
      clientId: 'egov-pdf-consumer',
      brokers: (options.kafkaHost || 'localhost:9092').split(',')
    });
    const groupId = options.groupId || 'kafka-node-group';
    this.consumer = kafka.consumer({ groupId });
    this.topics = topics;
    this.init();
  }

  async init() {
    try {
      await this.consumer.connect();
      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }
      this.emit('ready');
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.emit('message', {
            topic,
            value: message.value.toString(),
            partition,
            offset: message.offset
          });
        },
      });
    } catch (err) {
      this.emit('error', err);
    }
  }
}

module.exports = { KafkaClient, Producer, ConsumerGroup };
