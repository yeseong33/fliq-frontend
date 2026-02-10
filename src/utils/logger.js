const noop = () => {};

const logger = import.meta.env.PROD
  ? { log: noop, warn: noop, error: noop }
  : { log: console.log, warn: console.warn, error: console.error };

export default logger;
