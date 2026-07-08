const FLASH_MESSAGE_KEY = "DIGIT_FLASH_MESSAGE";

class FlashMessage {
  static set(message) {
    sessionStorage.setItem(FLASH_MESSAGE_KEY, JSON.stringify(message));
  }

  static get() {
    const value = sessionStorage.getItem(FLASH_MESSAGE_KEY);
    return value ? JSON.parse(value) : null;
  }

  static consume() {
    const value = this.get();

    if (value) {
      sessionStorage.removeItem(FLASH_MESSAGE_KEY);
    }

    return value;
  }

  static clear() {
    sessionStorage.removeItem(FLASH_MESSAGE_KEY);
  }
}

export default FlashMessage;
