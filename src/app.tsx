import { signal, computed, Signal, type ReadonlySignal } from "@preact/signals";
import { Delete } from "lucide-react";

interface Number {
  value: number;
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
      target: number;
    };

const stateSignal = signal<State>({
  state: "initial",
});

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
            case "×": {
              stack.push(b * a);
              break;
            }
            case "-": {
              stack.push(b - a);
              break;
            }
            case "÷": {
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
      <h1 className="text-3xl text-blue-500 mt-16 mb-4">The Numbers Round</h1>
      <p className="mb-4">How many big numbers would you like?</p>
      <div className="grid grid-cols-5 gap-4 w-full justify-between">
        <button
          className="bg-gray-200 text-gray-800 aspect-square rounded-full text-lg"
          onClick={() => buildGame(0)}
        >
          0
        </button>
        <button
          className="bg-gray-200 text-gray-800 aspect-square rounded-full text-lg"
          onClick={() => buildGame(1)}
        >
          1
        </button>
        <button
          className="bg-gray-200 text-gray-800 aspect-square rounded-full text-lg"
          onClick={() => buildGame(2)}
        >
          2
        </button>
        <button
          className="bg-gray-200 text-gray-800 aspect-square rounded-full text-lg"
          onClick={() => buildGame(3)}
        >
          3
        </button>
        <button
          className="bg-gray-200 text-gray-800 aspect-square rounded-full text-lg"
          onClick={() => buildGame(4)}
        >
          4
        </button>
      </div>
    </div>
  );
}

type Input = Number | "+" | "-" | "×" | "÷";

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
    <div className="h-dvh flex flex-col">
      <div className="flex-grow text-center text-blue-500 my-2">
        {currentGame.target}
      </div>
      <div className="text-3xl text-gray-700 mb-4 text-end">
        {input.value
          .map((value) => (typeof value === "object" ? value.value : value))
          .join(" ")}
      </div>
      <div className="grid grid-cols-4 grid-row-3 gap-2 text-xl mb-4">
        <button
          className="bg-blue-200 text-blue-800 rounded-full aspect-square"
          onClick={handleClick("+")}
        >
          +
        </button>
        <button
          className="bg-blue-200 text-blue-800 rounded-full aspect-square"
          onClick={handleClick("-")}
        >
          -
        </button>
        <button
          className="bg-blue-200 text-blue-800 rounded-full aspect-square"
          onClick={handleClick("×")}
        >
          ×
        </button>
        <button
          className="bg-blue-200 text-blue-800 rounded-full aspect-square"
          onClick={handleClick("÷")}
        >
          ÷
        </button>

        <div className="grid col-span-3 row-span-2 grid-cols-subgrid grid-rows-subgrid">
          {currentGame.numbers.map((num, i) => (
            <button
              key={`${num.value}-${i}`}
              className="bg-gray-200 text-gray-800 disabled:text-gray-400 rounded-full aspect-square disabled:ring-2 ring-gray-400"
              disabled={input.value.includes(num)}
              onClick={handleClick(num)}
            >
              {num.value}
            </button>
          ))}
        </div>

        <button
          className="bg-gray-200 text-gray-800 rounded-full aspect-square grid place-items-center"
          onClick={() => {
            const next = [...input.value];
            next.pop();
            input.value = next;
          }}
        >
          <Delete />
        </button>
        <button
          onClick={() => {
            stateSignal.value = {
              state: "done",
              target: currentGame.target,
              answer: answer.value ?? 0,
            };
          }}
          className="bg-blue-700 text-blue-200 rounded-full aspect-square"
        >
          =
        </button>
      </div>
    </div>
  );
}

function Screen() {
  const state = stateSignal.value;

  switch (state.state) {
    case "initial": {
      return <Home />;
    }
    case "playing": {
      return <Game currentGame={state} />;
    }
    case "done": {
      return (
        <div className="mt-16">
          <p className="text-lg mb-4">
            You managed to get {state.answer}.{" "}
            {state.answer > state.target
              ? state.answer - state.target
              : state.target - state.answer}{" "}
            away from the target of {state.target}
          </p>

          <button
            className="bg-blue-500 text-blue-100 p-4 rounded-full"
            onClick={() => {
              stateSignal.value = { state: "initial" };
            }}
          >
            Play again
          </button>
        </div>
      );
    }
  }
}

export function App() {
  return (
    <div className="max-w-md mx-auto px-4 font-mono">
      <Screen />
    </div>
  );
}
