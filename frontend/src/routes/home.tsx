export default function Home({
  user,
}: {
  user?: { id: number; login: string };
}) {
  const containerStyle: React.CSSProperties = {
    display: "grid",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    height: "100vh",
  };

  return (
    <div style={containerStyle}>
      <div>
        <h1>ft_transcendence {user ? "🔓" : "🔐"}</h1>
        {user && <div>Welcome {user.login}</div>}
      </div>
    </div>
  );
}
