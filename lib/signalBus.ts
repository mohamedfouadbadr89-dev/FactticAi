import { EventEmitter } from 'events';

/**
 * Signal Bus (v1.0.0)
 * 
 * Local EventEmitter for real-time signaling when Redis is unavailable.
 * Used primarily for development and verification environments.
 */
class SignalBus extends EventEmitter {
  private static instance: SignalBus;

  public static getInstance(): SignalBus {
    if (!SignalBus.instance) {
      SignalBus.instance = new SignalBus();
      // Ensure we don't leak listeners
      SignalBus.instance.setMaxListeners(100);
    }
    return SignalBus.instance;
  }
}

export const signalBus = SignalBus.getInstance();
