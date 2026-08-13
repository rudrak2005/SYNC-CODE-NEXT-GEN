import { Link } from "react-router-dom";

function ProjectCard({
  name,
  language,
  members
}) {
  return (
    <div className="project-card">

      <div>
        <span className="project-language">
          {language}
        </span>

        <h3>{name}</h3>

        <p>
          {members} members
        </p>
      </div>

      <Link to="/dashboard">
        Open
      </Link>

    </div>
  );
}

export default ProjectCard;