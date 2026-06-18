import LoginForm from "./LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <>
      <link rel="stylesheet" href="/legacy/assets/vendor/tabler-icons/tabler-icons.min.css" />
      <main
        style={{
          alignItems: "center",
          background: `
            radial-gradient(circle at 18% 8%, rgba(0,182,122,0.18), transparent 30%),
            radial-gradient(circle at 82% 18%, rgba(59,130,246,0.22), transparent 32%),
            linear-gradient(135deg, #07111f, #0b1d33 52%, #081423)
          `,
          display: "flex",
          justifyContent: "center",
          minHeight: "100svh",
          padding: "28px 14px",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 26,
            gridTemplateColumns: "1fr 1fr",
            maxWidth: 980,
            width: "100%",
          }}
          className="login-shell"
        >
          {/* Logo card */}
          <div
            style={{
              alignItems: "center",
              background: "linear-gradient(180deg, rgba(22,43,70,0.96), rgba(12,29,51,0.96))",
              border: "1px solid rgba(118,247,194,0.20)",
              borderRadius: 22,
              boxShadow: "0 28px 70px rgba(0,0,0,0.32)",
              display: "flex",
              justifyContent: "center",
              minHeight: 320,
              padding: 36,
              position: "relative",
            }}
          >
            <div
              style={{
                border: "2px solid rgba(85,80,68,0.18)",
                inset: 28,
                pointerEvents: "none",
                position: "absolute",
              }}
            />
            <div style={{ position: "relative", textAlign: "center" }}>
              <img
                src="/legacy/assets/bon-desti-logo.png"
                alt="Bon Desti"
                style={{ height: 80, marginBottom: 20, width: "auto" }}
              />
              <div
                style={{
                  color: "#e8e3d8",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 62,
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                Bon Desti
              </div>
              <div
                style={{
                  color: "#c9c4b8",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 24,
                  marginTop: 18,
                  textTransform: "uppercase",
                }}
              >
                Complejo Residencial
              </div>
            </div>
          </div>

          {/* Login form */}
          <LoginForm error={params.error} redirect={params.redirect} />
        </div>

        <style>{`
          @media (max-width: 768px) {
            .login-shell {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
