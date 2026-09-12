import { useAuthStore } from "../store/authStore";
import { LoginBox } from "./LoginBox";
import { DriveBox } from "./DriveBox";

export function Canvas() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="canvas">
      <div className="box">
        {token ? (
          <>
            <div className="box-title">logged in ✓</div>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <LoginBox />
        )}
      </div>

      <div className="arrow">───────▶</div>

      <div className="box drive-box">
        {token ? (
          <DriveBox />
        ) : (
          <div className="box-title">login required</div>
        )}
      </div>
    </div>
  );
}