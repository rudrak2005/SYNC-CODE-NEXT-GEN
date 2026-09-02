import "./OutputConsole.css";

function OutputConsole({
  output,
  input,
  setInput
}) {

  return (
    <div className="output-console">

      <div className="console-header">
        Terminal
      </div>

      <textarea
        className="console-input"
        placeholder="Program Input..."
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }
      />

      <pre className="console-output">
        {output}
      </pre>

    </div>
  );
}

export default OutputConsole;