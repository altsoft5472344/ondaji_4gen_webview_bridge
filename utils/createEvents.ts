interface EventsMap {
  [event: string]: any;
}

export interface DefaultEvents extends EventsMap {
  [event: string]: (...args: any) => void;
}

export interface EventEmitter<Events extends EventsMap = DefaultEvents> {
  emit<K extends keyof Events>(
    this: this,
    event: K,
    ...args: Parameters<Events[K]>
  ): void;

  events: Partial<{ [E in keyof Events]: Events[E][] }>;
  on<K extends keyof Events>(this: this, event: K, cb: Events[K]): () => void;
}

// 기본 이벤트 에미터 타입
export type DefaultEmitter = EventEmitter<DefaultEvents>;

export const createEvents = <
  Events extends EventsMap = DefaultEvents
>(): EventEmitter<Events> => ({
  events: {}, 
  emit(event, ...args) {
    const callbacks = this.events[event] || [];
    for (let i = 0, length = callbacks.length; i < length; i++) {
      callbacks[i](...args);
    }
  },

  on(event, cb) {
    if (!this.events[event]) {
      this.events[event] = [cb];
    } else {
      this.events[event]?.push(cb);
    }
    return () => {
      this.events[event] = this.events[event]?.filter((i) => cb !== i);
    };
  },
});

// Promise 리졸버 생성 옵션 인터페이스
export interface CreateResolverOptions {
  evaluate: () => void; 
}

// Promise 리졸버 생성 함수
export const createResolver = ({ evaluate }: CreateResolverOptions) => {
  console.log("===== createResolver =====");

  evaluate(); // 실행 함수 호출
};
