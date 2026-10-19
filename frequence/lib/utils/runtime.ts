import Constants, { ExecutionEnvironment } from 'expo-constants';

// true quand l'app tourne dans Expo Go (et pas dans une vraie build)
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;