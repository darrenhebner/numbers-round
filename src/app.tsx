import { signal, computed, Signal, type ReadonlySignal } from "@preact/signals";

interface Number {
  value: number;
}

interface Config {
  target: number;
  numbers: Number[];
}

type State =
  | {
      state: "initial";
    }
  | {
      state: "playing";
      target: number;
      numbers: Number[];
      input: Signal<Input[]>;
      answer: ReadonlySignal<number | null>;
    }
  | {
      state: "done";
      answer: number;
    };

const stateSignal = signal<State>({
  state: "initial",
});

const config = signal<Config | null>(null);

function Home() {
  function buildGame(numberOfLarge: number) {
    const largeNumbers = [25, 50, 75, 100];
    const smallNumbers = [
      1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10,
    ];

    const numbers: Number[] = [];

    const shuffledLarge = [...largeNumbers].sort(() => Math.random() - 0.5);
    const shuffledSmall = [...smallNumbers].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numberOfLarge; i++) {
      numbers.push({ value: shuffledLarge[i] });
    }

    for (let i = 0; i < 6 - numberOfLarge; i++) {
      numbers.push({ value: shuffledSmall[i] });
    }

    const target = Math.floor(Math.random() * 900) + 100;
    const input = signal<Input[]>([]);

    stateSignal.value = {
      state: "playing",
      numbers,
      target,
      input,
      answer: computed(() => {
        const stack: number[] = [];

        for (const value of input.value) {
          if (typeof value === "object" && "value" in value) {
            stack.push(value.value);
            continue;
          }

          const a = stack.pop();
          const b = stack.pop();

          if (!a || !b) {
            console.error("Not enough values in the stack");
            continue;
          }

          switch (value) {
            case "+": {
              stack.push(b + a);
              break;
            }
            case "*": {
              stack.push(b * a);
              break;
            }
            case "-": {
              stack.push(b - a);
              break;
            }
            case "/": {
              stack.push(b / a);
              break;
            }
          }
        }

        return stack[0] ?? null;
      }),
    };
  }

  return (
    <div>
      <button onClick={() => buildGame(0)}>0</button>
      <button onClick={() => buildGame(1)}>1</button>
      <button onClick={() => buildGame(2)}>2</button>
      <button onClick={() => buildGame(3)}>3</button>
      <button onClick={() => buildGame(4)}>4</button>
    </div>
  );
}

type Input = Number | "+" | "-" | "*" | "/";

function Game({
  currentGame,
}: {
  currentGame: Extract<State, { state: "playing" }>;
}) {
  const { input, answer } = currentGame;

  function handleClick(value: Input) {
    return () => {
      const next = [...input.value];
      next.push(value);
      input.value = next;
    };
  }

  return (
    <div>
      <div>
        {input.value
          .map((value) => {
            if (typeof value === "object") {
              return value.value;
            }

            return value;
          })
          .join(" ")}
      </div>
      <div>
        {currentGame.numbers
          .filter((num) => !input.value.includes(num))
          .map((num, i) => (
            <button key={`${num.value}-${i}`} onClick={handleClick(num)}>
              {num.value}
            </button>
          ))}
      </div>
      <div>
        <button onClick={handleClick("+")}>+</button>
        <button onClick={handleClick("-")}>-</button>
        <button onClick={handleClick("*")}>*</button>
        <button onClick={handleClick("/")}>/</button>
      </div>
      <button
        onClick={() => {
          const next = [...input.value];
          next.pop();
          input.value = next;
        }}
      >
        ⬅️
      </button>
      <div>Target: {currentGame.target}</div>
      <div>Answer: {answer.value}</div>
      <button onClick={() => (config.value = null)}>Reset</button>
    </div>
  );
}

export function App() {
  const state = stateSignal.value;

  switch (state.state) {
    case "initial": {
      return <Home />;
    }
    case "playing": {
      return <Game currentGame={state} />;
    }
    case "done": {
      return null;
    }
  }
}
