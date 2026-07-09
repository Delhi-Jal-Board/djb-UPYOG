import { Kafka, Partitioners } from "kafkajs";
import logger from "../config/logger";
import envVariables from "../EnvironmentVariables";

const kafka = new Kafka({
  clientId: "pdf-service",
  brokers: envVariables.KAFKA_BROKER_HOST.split(",")
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

producer.on(producer.events.CONNECT, () => {
  logger.info("Producer is ready");
});

producer.on(producer.events.DISCONNECT, (err) => {
  if (err) {
    logger.error("Producer is in error state");
    logger.error(err.stack || err);
  }
});

producer.connect().catch(e => logger.error("Error connecting producer: " + e));

export default producer;
