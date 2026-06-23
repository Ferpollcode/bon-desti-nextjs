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
            gridTemplateColumns: "minmax(280px, 1.15fr) minmax(280px, 0.85fr)",
            maxWidth: 980,
            width: "100%",
          }}
          className="login-shell"
        >
          {/* Logo card */}
          <div
            className="login-brand-card"
            style={{
              alignItems: "center",
              background: "linear-gradient(180deg, rgba(22,43,70,0.96), rgba(12,29,51,0.96))",
              border: "1px solid rgba(118,247,194,0.20)",
              borderRadius: 22,
              boxShadow: "0 28px 70px rgba(0,0,0,0.32)",
              display: "flex",
              justifyContent: "center",
              minHeight: 500,
              padding: 36,
              position: "relative",
            }}
          >
            <div
              className="login-brand-frame"
              style={{
                border: "2px solid rgba(118,247,194,0.22)",
                borderRadius: 18,
                inset: "28px",
                pointerEvents: "none",
                position: "absolute",
              }}
            />
            <div style={{ position: "relative", textAlign: "center" }}>
              <div
                className="login-brand-title"
                style={{
                  color: "#ffffff",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 62,
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                Bon Desti
              </div>
              <div
                className="login-brand-subtitle"
                style={{
                  color: "#b8c6d9",
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
            main {
              align-items: flex-start !important;
              min-height: 100svh !important;
              padding: 10px !important;
              overflow: hidden !important;
            }
            .login-shell {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
              max-width: 420px !important;
            }
            .login-brand-card {
              min-height: 128px !important;
              padding: 14px !important;
              border-radius: 14px !important;
            }
            .login-brand-frame {
              inset: 10px !important;
              border-radius: 12px !important;
            }
            .login-brand-title {
              font-size: 34px !important;
            }
            .login-brand-subtitle {
              font-size: 14px !important;
              margin-top: 8px !important;
              white-space: nowrap !important;
            }
            .login-panel {
              border-radius: 14px !important;
              padding: 16px !important;
            }
            .login-panel h2 {
              font-size: 24px !important;
              margin-bottom: 4px !important;
            }
            .login-panel p {
              margin-bottom: 12px !important;
            }
            .login-panel input {
              min-height: 40px !important;
            }
            .login-panel button[type="submit"] {
              min-height: 44px !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
