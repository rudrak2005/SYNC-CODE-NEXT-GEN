import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

function CreateProject() {
  const [projectName, setProjectName] = useState("");

  return (
    <div className="form-page">

      <div className="form-card">

        <Link to="/dashboard">
          ← Dashboard
        </Link>

        <h1>Create Project</h1>

        <p>
          Create a new collaborative development workspace.
        </p>

        <label>
          Project Name
        </label>

        <Input
          placeholder="Enter project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <label>
          Programming Language
        </label>

        <select className="input-field">
          <option>JavaScript</option>
          <option>Python</option>
          <option>C++</option>
          <option>Rust</option>
        </select>

        <Button type="button">
          Create Project
        </Button>

      </div>

    </div>
  );
}

export default CreateProject;