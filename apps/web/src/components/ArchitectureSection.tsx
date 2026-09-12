import architectureImage from "../assets/architecture.png";

export function ArchitectureSection() {
  return (
    <section className="architecture-section">
      <h2 className="architecture-heading">Architecture</h2>
      <img
        src={architectureImage}
        alt="System architecture"
        className="architecture-image"
      />
    </section>
  );
}