import FlashMessage from "../services/atoms/Utils/FlashMessage";

const useToast = () => {
  const setToast = (message) => {
    FlashMessage.set(message);
  };

  const getToast = () => {
    return FlashMessage.get();
  };

  const consumeToast = () => {
    return FlashMessage.consume();
  };

  const clearToast = () => {
    FlashMessage.clear();
  };

  return {
    setToast,
    getToast,
    consumeToast,
    clearToast,
  };
};

export default useToast;
