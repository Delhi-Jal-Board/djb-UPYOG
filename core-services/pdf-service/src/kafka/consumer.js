import { Kafka } from "kafkajs";
import envVariables from "../EnvironmentVariables";
import logger from "../config/logger";
import { createNoSave } from "../index";
import async from "async";

export const listenConsumer = async (topic) => {
  let receiveJob = topic;
  var topicList = [];
  for (var i in receiveJob) {
    topicList.push(receiveJob[i]);
  }

  const kafka = new Kafka({
    clientId: "pdf-service-consumer",
    brokers: envVariables.KAFKA_BROKER_HOST.split(",")
  });

  const consumer = kafka.consumer({ groupId: "bulk-pdf" });

  var q = async.queue(function(data, cb) {
    createNoSave(data, null, () => {}, () => {}).then(function(ep) {
      cb();
    });
  }, 1);

  q.drain(async () => {
    // Queue drained - ready for more messages
  });

  await consumer.connect();
  logger.info("Consumer is ready");

  for (const t of topicList) {
    await consumer.subscribe({ topic: t, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      logger.info("record received on consumer for create");
      try {
        var data = JSON.parse(message.value.toString());
        q.push(data, function(err, result) {
          if (err) { logger.error(err); return; }
        });
      } catch (error) {
        logger.error("error in create request by consumer " + error.message);
        logger.error(error.stack || error);
      }
    }
  });

  consumer.on(consumer.events.CRASH, (err) => {
    logger.error("Consumer crashed:", err);
  });
};